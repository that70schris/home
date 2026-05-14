Basic script hierarchy:

window_main.xml
  view_header.xml
  view_statusbar.xml
  view_homeedit.xml
    focus_view_cabmic.xml*
    focus_view_focus_eq.xml*
    focus_view_focus_xy.xml*
  view_librarian.xml
    browser_view_preset.xml*
    browser_view_ir.xml*
    browser_view_favorite.xml*
    browser_view_template.xml*
    browser_view_song.xml*
  view_command_center.xml
  view_globaleq.xml

* Loaded dynamically in code; all others are script objects in window_main.xml.

