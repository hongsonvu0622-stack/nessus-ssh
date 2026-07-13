export const translations = {
  vi: {
    // Sidebar
    sidebar: {
      workspace: 'KHÔNG GIAN LÀM VIỆC',
      connections: 'Danh Sách Kết Nối',
      sftp: 'Trình Quản Lý Tệp SFTP',
      snippets: 'Lệnh Nhanh & Kịch Bản',
      identities: 'Khóa Bảo Mật SSH',
      settings: 'Cài Đặt Hệ Thống',
      activeSessions: 'PHIÊN ĐANG MỞ',
      openLocalShell: 'Mở Shell Nội Bộ',
      language: 'Ngôn ngữ (Language)',
      checkUpdate: '🔄 Kiểm tra cập nhật',
      hasNewUpdate: '✨ Có bản cập nhật mới',
      checkUpdateTitle: 'Kiểm tra phiên bản mới từ GitHub'
    },
    // HostList
    hostList: {
      pageTitle: 'Kết Nối SSH & Serial',
      pageSubTitle: 'Quản lý máy chủ theo Thư mục Nhóm, nhập xuất bảng tính Excel & truy cập Terminal',
      byFolder: 'Thư mục',
      allHostsGrid: 'Tất cả',
      createGroupBtn: '+ Tạo Thư mục Nhóm',
      searchPlaceholder: 'Tìm kiếm máy chủ, IP, nhãn hoặc nhóm...',
      newConnection: 'Kết Nối',
      scanSerial: 'Serial',
      scanSerialTooltip: 'Quét tự động thiết bị USB / Serial console đang cắm',
      newGroup: 'Thêm Nhóm',
      serialConsole: 'Cổng Serial (USB/UART)',
      importConfig: 'Nhập ~/.ssh/config',
      importExcel: 'Import Excel',
      exportBackup: 'Export Backup',
      allGroups: 'Tất cả nhóm',
      ungrouped: 'Chưa phân nhóm',
      filterAll: 'Tất cả',
      filterSsh: 'SSH',
      filterSerial: 'Serial Console',
      filterLocal: 'Local Shell',
      serverCount: 'máy chủ',
      addHostBtn: '+ Thêm Host',
      openTerminalBtn: 'Mở Terminal',
      connect: 'Kết Nối',
      edit: 'Chỉnh sửa',
      delete: 'Xóa kết nối',
      noHosts: 'Chưa có kết nối nào. Nhấn "+ Thêm Máy Chủ" hoặc nhập từ ~/.ssh/config để bắt đầu!',
      emptyFolderMsg: 'Thư mục này chưa có máy chủ nào.',
      addHostToGroupBtn: '+ Thêm Host vào nhóm này'
    },
    // Terminal Tab
    terminal: {
      noTabs: 'Không có Tab Terminal nào đang mở',
      runSnippet: 'Chạy lệnh nhanh',
      sftpBtn: 'Duyệt SFTP',
      authRequiredTitle: 'Yêu Cầu Xác Thực SSH',
      authRequiredDesc: 'Kết nối yêu cầu mật khẩu hoặc khóa SSH hợp lệ để đăng nhập vào máy chủ',
      passwordTab: '🔑 Mật Khẩu',
      sshKeyTab: '🛡 Đổi Khóa SSH',
      passwordPlaceholder: 'Nhập mật khẩu SSH của bạn...',
      selectKeyLabel: 'Chọn Khóa SSH từ ~/.ssh',
      customKeyPlaceholder: 'Hoặc nhập đường dẫn tuyệt đối đến tệp khóa...',
      passphrasePlaceholder: 'Mật khẩu bảo vệ khóa (Passphrase - bỏ trống nếu không có)',
      confirmRetry: 'Xác nhận & Thử lại',
      cancel: 'Hủy bỏ'
    },
    // SFTP
    sftp: {
      authTitle: 'Xác Thực Kết Nối SFTP',
      authDesc: 'Vui lòng chọn phương thức đăng nhập (Mật khẩu hoặc Khóa SSH) trước khi kết nối SFTP',
      connectBtn: 'Kết Nối SFTP',
      disconnectBtn: 'Ngắt Kết Nối / Đổi Đăng Nhập',
      upDir: 'Thư mục cha',
      refresh: 'Tải lại',
      selectServer: 'Chọn Máy Chủ SSH'
    },
    // Modals
    modals: {
      save: 'Lưu Cấu Hình',
      cancel: 'Hủy'
    },
    // Snippets
    snippets: {
      pageTitle: 'Command Snippets & Scripts',
      pageSubTitle: 'Lưu trữ các lệnh thao tác thường dùng trên Linux SSH hoặc Cisco/Network Serial Console',
      addNew: 'Thêm Snippet Mới',
      titleLabel: 'Tên mô tả Snippet',
      titlePlaceholder: 'ví dụ: Check Nginx Log',
      categoryLabel: 'Phân loại (Category)',
      commandLabel: 'Câu lệnh (Command)',
      saveBtn: 'Lưu Snippet'
    },
    // Identity Manager
    identity: {
      pageTitle: 'Keychain & SSH Identities',
      pageSubTitle: 'Quản lý, tạo mới và import khóa SSH (`~/.ssh`) để chọn trực tiếp khi đăng nhập máy chủ',
      importKeyBtn: 'Import Khóa',
      createKeyBtn: 'Tạo Khóa SSH Mới',
      refreshBtn: 'Làm mới danh sách',
      copyPubKey: 'Sao chép Public Key',
      copiedPubKey: 'Đã sao chép Public Key',
      scanning: 'Đang quét khóa SSH trong ~/.ssh...',
      emptyMsg: 'Không tìm thấy Private Key nào trong thư mục ~/.ssh của bạn. Hãy bấm "Tạo Khóa SSH Mới"!',
      genTitle: 'Tạo Khóa SSH Mới (`ssh-keygen`)',
      keyFilename: 'Tên tệp khóa (lưu tại ~/.ssh/)',
      cryptoAlgo: 'Thuật toán mã hóa',
      comment: 'Ghi chú (Comment)',
      genSubmit: 'Tạo Khóa Ngay',
      genLoading: 'Đang tạo khóa...',
      importTitle: 'Import Khóa Private Key vào Keychain (~/.ssh/)',
      importFilename: 'Tên tệp lưu trong ~/.ssh/',
      dragDropText: 'Kéo thả tệp Private Key vào đây hoặc Nhấp chọn từ máy',
      dragDropSub: 'Hỗ trợ tệp OpenSSH / PEM (.pem, id_rsa, id_ed25519...)',
      privateKeyContent: 'Nội dung Private Key (PEM/OpenSSH)',
      publicKeyContent: 'Nội dung Public Key (.pub) - Không bắt buộc',
      reviewTitle: 'Xem Trước Thông Tin Khóa (Review Before Import)',
      importSubmit: 'Lưu Khóa',
      importLoading: 'Đang lưu...',
      deleteKey: 'Xóa Khóa',
      deleteConfirmTitle: 'Xác Nhận Xóa Khóa SSH',
      deleteConfirmDesc: 'Bạn có chắc chắn muốn xóa vĩnh viễn tệp khóa này khỏi thư mục ~/.ssh? Hành động này không thể hoàn tác.'
    },
    // Update Modal
    updateModal: {
      title: 'Cập Nhật Phần Mềm',
      checking: 'Đang kiểm tra phiên bản mới...',
      updateError: 'Lỗi kiểm tra cập nhật',
      upToDate: 'Bạn đang sử dụng phiên bản mới nhất!',
      currentVersion: 'Phiên bản hiện tại: ',
      latestVersion: 'Mới nhất: ',
      checkAgain: 'Kiểm tra lại',
      releaseNotes: '📝 Ghi chú thay đổi',
      close: 'Đóng',
      downloadUpdate: 'Tải Về & Cập Nhật Ngay',
      bgDownloadBtn: '⚡ Tải ngầm & Tự động cài đặt',
      downloadingBg: 'Đang tải bản cập nhật ngầm...',
      installNowBtn: '🚀 Cài đặt ngay & Tự dọn dẹp bộ cài',
      installingMsg: '⏳ Đang giải nén & cài đặt bản cập nhật... Vui lòng giữ ứng dụng mở.',
      installSuccessMsg: '🎉 Cập nhật thành công! Ứng dụng sẽ tự động tắt & mở lại phiên bản mới sau 3 giây...',
      externalDownload: 'Tải qua trình duyệt'
    },
    // Host Modal
    hostModal: {
      passphraseLabel: 'Passphrase mở khóa Private Key (Nếu có)',
      passphrasePlaceholder: 'Mật khẩu mở khóa khóa SSH (để trống nếu hỏi khi kết nối hoặc không có)',
      passphraseHint: '🔐 Nếu khóa SSH có Passphrase nhưng để trống, ứng dụng sẽ tự động hiện hộp thoại hỏi Passphrase khi kết nối',
      scanningPorts: 'Đang quét...',
      rescanPorts: 'Quét lại cổng'
    },
    serialModal: {
      title: 'Quét Thiết Bị Serial (USB / UART / COM)',
      subTitle: 'Cáp USB-to-Serial / Cisco Console Cable / COM Port / Arduino / IoT',
      rescanTitle: 'Quét lại',
      baudRateLabel: 'Mặc định Baud Rate cho kết nối:',
      scanning: 'Đang quét cổng Serial (USB / COM / UART)...',
      noPorts: 'Không tìm thấy cổng Serial nào đang kết nối. Hãy cắm cáp USB Console / COM port vào máy tính và bấm Refresh.',
      connectNow: 'Kết nối ngay',
      saveHost: '+ Lưu vào danh sách Host',
      refresh: 'Làm mới',
      baud: 'baud',
      save: 'Lưu'
    },
    // App
    app: {
      checkNewUpdateBtn: 'Kiểm tra bản cập nhật mới',
      checkingUpdate: '⏳ Đang kiểm tra phiên bản mới từ GitHub...',
      latestVersionMsg: '✔ Bạn đang sử dụng phiên bản mới nhất.',
      viewAndDownload: 'Xem chi tiết & Tải về',
      autoCheckTitle: 'Tự động kiểm tra bản cập nhật khi khởi động ứng dụng (Auto-Check Updates)',
      autoCheckDesc: 'Ứng dụng tự động thông báo khi có bản phát hành mới trên GitHub Releases.',
      bannerClick: 'Nhấp để xem chi tiết và tải về',
      settingsTitle: 'Cài Đặt & Cập Nhật Phần Mềm',
      settingsSubTitle: 'Quản lý phiên bản, kiểm tra cập nhật mới và cấu hình hệ thống NexusSSH Pro.'
    }
  },
  en: {
    // Sidebar
    sidebar: {
      workspace: 'WORKSPACE',
      connections: 'Connections',
      sftp: 'SFTP Explorer',
      snippets: 'Snippets & Scripts',
      identities: 'SSH Keys & Identity',
      settings: 'Settings',
      activeSessions: 'ACTIVE SESSIONS',
      openLocalShell: 'Open Local Shell',
      language: 'Language',
      checkUpdate: '🔄 Check for updates',
      hasNewUpdate: '✨ New update available',
      checkUpdateTitle: 'Check for new release on GitHub'
    },
    // HostList
    hostList: {
      pageTitle: 'SSH & Serial Connections',
      pageSubTitle: 'Manage servers by group folders, import/export Excel spreadsheets & launch terminals',
      byFolder: 'Folders',
      allHostsGrid: 'All',
      createGroupBtn: '+ New Group',
      searchPlaceholder: 'Search servers, IP, tags or groups...',
      newConnection: 'Connection',
      scanSerial: 'Serial',
      scanSerialTooltip: 'Auto-scan connected USB / Serial console devices',
      newGroup: 'New Group',
      serialConsole: 'Serial Console (UART)',
      importConfig: 'Import ~/.ssh/config',
      importExcel: 'Import Excel',
      exportBackup: 'Export Backup',
      allGroups: 'All Groups',
      ungrouped: 'Ungrouped',
      filterAll: 'All',
      filterSsh: 'SSH',
      filterSerial: 'Serial Console',
      filterLocal: 'Local Shell',
      serverCount: 'servers',
      addHostBtn: '+ Add Host',
      openTerminalBtn: 'Open Terminal',
      connect: 'Connect',
      edit: 'Edit',
      delete: 'Delete connection',
      noHosts: 'No connections yet. Click "+ New Connection" or import from ~/.ssh/config to get started!',
      emptyFolderMsg: 'This folder has no servers yet.',
      addHostToGroupBtn: '+ Add Host to this group'
    },
    // Terminal Tab
    terminal: {
      noTabs: 'No active Terminal tabs open',
      runSnippet: 'Run Snippet',
      sftpBtn: 'SFTP Explorer',
      authRequiredTitle: 'SSH Authentication Required',
      authRequiredDesc: 'Authentication failed or required. Please provide credentials to authenticate with server',
      passwordTab: '🔑 Password',
      sshKeyTab: '🛡 Change SSH Key',
      passwordPlaceholder: 'Enter your SSH password...',
      selectKeyLabel: 'Select SSH Key from ~/.ssh',
      customKeyPlaceholder: 'Or enter absolute path to private key file...',
      passphrasePlaceholder: 'Key Passphrase (leave blank if unencrypted)',
      confirmRetry: 'Confirm & Retry',
      cancel: 'Cancel'
    },
    // SFTP
    sftp: {
      authTitle: 'SFTP Connection Authentication',
      authDesc: 'Please select login method (Password or SSH Key) before connecting to SFTP',
      connectBtn: 'Connect SFTP',
      disconnectBtn: 'Disconnect / Change Auth',
      upDir: 'Parent Dir',
      refresh: 'Refresh',
      selectServer: 'Select SSH Server'
    },
    // Modals
    modals: {
      save: 'Save Configuration',
      cancel: 'Cancel'
    },
    // Snippets
    snippets: {
      pageTitle: 'Command Snippets & Scripts',
      pageSubTitle: 'Store frequently used Linux SSH commands or Cisco/Network Serial scripts',
      addNew: 'Add New Snippet',
      titleLabel: 'Snippet Title',
      titlePlaceholder: 'e.g., Check Nginx Log',
      categoryLabel: 'Category',
      commandLabel: 'Command',
      saveBtn: 'Save Snippet'
    },
    // Identity Manager
    identity: {
      pageTitle: 'Keychain & SSH Identities',
      pageSubTitle: 'Manage, generate and import SSH keys (~/.ssh) for direct selection when connecting to servers',
      importKeyBtn: 'Import Key',
      createKeyBtn: 'New SSH Key',
      refreshBtn: 'Refresh List',
      copyPubKey: 'Copy Public Key',
      copiedPubKey: 'Copied Public Key',
      scanning: 'Scanning SSH keys in ~/.ssh...',
      emptyMsg: 'No SSH private keys found in ~/.ssh. Click "New SSH Key" to create one!',
      genTitle: 'Generate New SSH Key (ssh-keygen)',
      keyFilename: 'Key filename (saved to ~/.ssh/)',
      cryptoAlgo: 'Encryption Algorithm',
      comment: 'Comment',
      genSubmit: 'Generate Key',
      genLoading: 'Generating key...',
      importTitle: 'Import Private Key to Keychain (~/.ssh/)',
      importFilename: 'Save file name in ~/.ssh/',
      dragDropText: 'Drag & drop your Private Key file here or click to browse',
      dragDropSub: 'Supports OpenSSH / PEM format (.pem, id_rsa, id_ed25519...)',
      privateKeyContent: 'Private Key Content (PEM/OpenSSH)',
      publicKeyContent: 'Public Key Content (.pub) - Optional',
      reviewTitle: 'Review Key Details Before Import',
      importSubmit: 'Save Key',
      importLoading: 'Saving...',
      deleteKey: 'Delete Key',
      deleteConfirmTitle: 'Confirm Delete SSH Key',
      deleteConfirmDesc: 'Are you sure you want to permanently delete this SSH key file from ~/.ssh? This action cannot be undone.'
    },
    // Update Modal
    updateModal: {
      title: 'Software Update',
      checking: 'Checking for new release...',
      updateError: 'Update check error',
      upToDate: 'You are running the latest version!',
      currentVersion: 'Current version: ',
      latestVersion: 'Latest: ',
      checkAgain: 'Check again',
      releaseNotes: '📝 Release notes',
      close: 'Close',
      downloadUpdate: 'Download & Update Now',
      bgDownloadBtn: '⚡ Background Download & Install',
      downloadingBg: 'Downloading update in background...',
      installNowBtn: '🚀 Install Now & Auto-Cleanup Package',
      installingMsg: '⏳ Extracting & installing update... Please keep app open.',
      installSuccessMsg: '🎉 Update successful! App will quit & relaunch the new version in 3 seconds...',
      externalDownload: 'Browser Download'
    },
    // Host Modal
    hostModal: {
      passphraseLabel: 'SSH Key Passphrase (Optional)',
      passphrasePlaceholder: 'Passphrase to decrypt private key (leave blank to prompt on connect)',
      passphraseHint: '🔐 If the key requires a passphrase and left blank, you will be prompted securely when connecting',
      scanningPorts: 'Scanning...',
      rescanPorts: 'Rescan Ports'
    },
    serialModal: {
      title: 'Scan Serial Devices (USB / UART / COM)',
      subTitle: 'USB-to-Serial Cables / Cisco Console Cable / COM Port / Arduino / IoT',
      rescanTitle: 'Rescan',
      baudRateLabel: 'Default Baud Rate for connections:',
      scanning: 'Scanning Serial ports (USB / COM / UART)...',
      noPorts: 'No connected Serial ports found. Plug in your USB Console cable / COM port and click Refresh.',
      connectNow: 'Connect Now',
      saveHost: '+ Save to Host list',
      refresh: 'Refresh',
      baud: 'baud',
      save: 'Save'
    },
    // App
    app: {
      checkNewUpdateBtn: 'Check for software updates',
      checkingUpdate: '⏳ Checking for updates on GitHub...',
      latestVersionMsg: '✔ You are running the latest version.',
      viewAndDownload: 'View details & Download',
      autoCheckTitle: 'Automatically check for updates on startup',
      autoCheckDesc: 'Automatically notify when a new release is published on GitHub.',
      bannerClick: 'Click to view details and download',
      settingsTitle: 'Settings & Software Update',
      settingsSubTitle: 'Manage version, check for updates and configure NexusSSH Pro system.'
    }
  }
};
