# SFTP Setup Guide

This guide explains how to configure SFTP transfers from the P35Edit app to a Linux VM.

## Overview

The app uses SFTP to transfer song files to a Linux VM. The build process automatically includes the SSH keys from the repo (`content/sshKeys/id_hedit`), so you only need to:

1. Set environment variables for development
2. Add the app's public key to the target user's `authorized_keys` on the VM

## Environment Variables

Set these in your Xcode scheme (Edit Scheme → Run → Arguments → Environment Variables):

- **`P35_SSH_USERNAME`**: SSH username on the target VM (defaults to `"hedit"` if not set)
- **`P35_SFTP_REMOTE_ROOT`**: Remote root path on the VM (defaults to `"data/stadium-family-fw"` if not set)

### Example Development Settings

```
P35_SSH_USERNAME=rkylberg
P35_SFTP_REMOTE_ROOT=/home/rkylberg/.local/stadium/p35
```

These settings will cause the app to:
- Authenticate as `rkylberg` on the VM
- Upload songs to `/home/rkylberg/.local/stadium/p35/songs/archives/`

## Adding the SSH Key to the VM

The app uses the SSH key from `content/sshKeys/id_hedit` (or `tools/keys/id_hedit` for Windows builds). You need to add the corresponding public key to the target user's `authorized_keys` on the VM.

**Note:** You must already have SSH access to the VM to run the setup script. The script uses your existing SSH credentials to add the app's key, enabling the app to authenticate independently.

### Quick Setup (Automated)

Run the setup script from the `content/sshKeys/` directory:

```bash
cd content/sshKeys
./setup_sftp_key.sh user@hostname
```

Replace `user@hostname` with your VM user and host. Examples:
- `./setup_sftp_key.sh rkylberg@10.211.55.3`
- `./setup_sftp_key.sh myuser@192.168.1.100`

You can also use environment variables:
```bash
P35_VM_HOST=10.211.55.3 P35_VM_USER=rkylberg ./setup_sftp_key.sh
```

### Manual Setup

1. Display the public key:
   ```bash
   cat content/sshKeys/id_hedit.pub
   ```

2. SSH into your VM and add it to authorized_keys:
   ```bash
   ssh rkylberg@10.211.55.3
   mkdir -p ~/.ssh
   chmod 700 ~/.ssh
   nano ~/.ssh/authorized_keys
   # Paste the public key, save and exit
   chmod 600 ~/.ssh/authorized_keys
   ```

## How It Works

1. **Build Process**: The CMake build automatically copies `content/sshKeys/id_hedit` into the app bundle's `Contents/Resources/sshKeys/` directory.

2. **Authentication**: The app uses the private key from the bundle to authenticate as the user specified in `P35_SSH_USERNAME`.

3. **File Transfer**: Songs are uploaded to `{P35_SFTP_REMOTE_ROOT}/songs/archives/` on the target VM.

## Troubleshooting

### Authentication Fails

- Verify the public key is in the target user's `authorized_keys`:
  ```bash
  ssh user@host "cat ~/.ssh/authorized_keys | grep -F '$(cat content/sshKeys/id_hedit.pub | cut -d' ' -f1-2)'"
  ```

- Check SSH server logs on the VM:
  ```bash
  ssh user@host "sudo tail -f /var/log/auth.log"
  ```

### Transfer Fails

- Verify the remote directory exists and is writable:
  ```bash
  ssh user@host "ls -ld {P35_SFTP_REMOTE_ROOT}/songs/archives/"
  ```

- Check environment variables are set correctly in Xcode scheme

