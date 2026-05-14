#!/bin/bash
# Add the app's SSH public key to authorized_keys on the target VM
# Usage: ./setup_sftp_key.sh [user@host]
#        P35_VM_HOST=hostname P35_VM_USER=username ./setup_sftp_key.sh
# Example: ./setup_sftp_key.sh rkylberg@10.211.55.3
#          ./setup_sftp_key.sh user@192.168.1.100

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Get target from command line, environment variables, or prompt
if [ -n "$1" ]; then
    TARGET="$1"
elif [ -n "$P35_VM_HOST" ] && [ -n "$P35_VM_USER" ]; then
    TARGET="${P35_VM_USER}@${P35_VM_HOST}"
elif [ -n "$P35_VM_HOST" ]; then
    # If only host is set, try to get username from env or use current user
    TARGET="${P35_VM_USER:-${USER}}@${P35_VM_HOST}"
else
    echo "Usage: $0 [user@host]"
    echo "   or: P35_VM_HOST=hostname P35_VM_USER=username $0"
    echo ""
    echo "Examples:"
    echo "  $0 rkylberg@10.211.55.3"
    echo "  $0 user@192.168.1.100"
    echo "  P35_VM_HOST=10.211.55.3 P35_VM_USER=rkylberg $0"
    exit 1
fi

# Find the repo's public and private keys (relative to script location)
if [ -f "$SCRIPT_DIR/id_hedit.pub" ] && [ -f "$SCRIPT_DIR/id_hedit" ]; then
    PUB_KEY_FILE="$SCRIPT_DIR/id_hedit.pub"
    PRIV_KEY_FILE="$SCRIPT_DIR/id_hedit"
elif [ -f "$SCRIPT_DIR/../../tools/keys/id_hedit.pub" ] && [ -f "$SCRIPT_DIR/../../tools/keys/id_hedit" ]; then
    PUB_KEY_FILE="$SCRIPT_DIR/../../tools/keys/id_hedit.pub"
    PRIV_KEY_FILE="$SCRIPT_DIR/../../tools/keys/id_hedit"
else
    echo "Error: Could not find id_hedit.pub and id_hedit in $SCRIPT_DIR/ or tools/keys/"
    exit 1
fi

echo "Adding app SSH key (id_hedit) to $TARGET"
echo ""
echo "Note: You must already have SSH access to $TARGET to run this script."
echo "      This script sets up the app's key so it can authenticate independently."
echo ""

# Add the key to authorized_keys
cat "$PUB_KEY_FILE" | ssh "$TARGET" "mkdir -p ~/.ssh && chmod 700 ~/.ssh && \
    if ! grep -qF \"\$(cat)\" ~/.ssh/authorized_keys 2>/dev/null; then \
        cat >> ~/.ssh/authorized_keys && \
        chmod 600 ~/.ssh/authorized_keys && \
        echo '✓ App key added to authorized_keys'; \
    else \
        echo '✓ App key already in authorized_keys'; \
    fi"

if [ $? -eq 0 ]; then
    echo ""
    echo "Setup complete! The app can now authenticate using the id_hedit key."
    echo ""
    
    # Test the setup
    echo "=== Testing App Key Authentication ==="
    echo ""
    echo "Verifying that the app's key (id_hedit) can authenticate..."
    echo ""
    
    # Test 1: Verify key is in authorized_keys
    echo "1. Verifying app key is in authorized_keys..."
    PUB_KEY_CONTENT=$(cat "$PUB_KEY_FILE" | cut -d' ' -f1-2)
    if ssh "$TARGET" "grep -qF \"$PUB_KEY_CONTENT\" ~/.ssh/authorized_keys" 2>/dev/null; then
        echo "   ✓ App key found in authorized_keys"
    else
        echo "   ✗ App key not found in authorized_keys"
        echo "   (This may be a false negative if the key format differs)"
    fi
    
    # Test 2: Test SSH authentication with the app's private key
    echo ""
    echo "2. Testing app key authentication..."
    if ssh -i "$PRIV_KEY_FILE" -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -o ConnectTimeout=5 "$TARGET" "echo 'App key authentication successful'" 2>/dev/null; then
        echo "   ✓ App key authentication works!"
    else
        echo "   ✗ App key authentication failed"
        echo "   (This may fail if you need to accept the host key first)"
    fi
    
    # Test 3: Verify remote directory exists (if P35_SFTP_REMOTE_ROOT is set)
    if [ -n "$P35_SFTP_REMOTE_ROOT" ]; then
        echo ""
        echo "3. Checking remote directory..."
        REMOTE_DIR="${P35_SFTP_REMOTE_ROOT}/songs/archives"
        if ssh -i "$PRIV_KEY_FILE" -o StrictHostKeyChecking=no "$TARGET" "test -d \"$REMOTE_DIR\" && test -w \"$REMOTE_DIR\"" 2>/dev/null; then
            echo "   ✓ Remote directory exists and is writable: $REMOTE_DIR"
        else
            echo "   ⚠ Remote directory may not exist or be writable: $REMOTE_DIR"
            echo "   (You may need to create it manually)"
        fi
    fi
    
    echo ""
    echo "=== Test Complete ==="
    echo ""
    echo "If all tests passed, the app can authenticate using the id_hedit key"
    echo "and should be able to transfer files via SFTP."
else
    echo ""
    echo "Error: Failed to add key. Make sure you can SSH to $TARGET"
    exit 1
fi

