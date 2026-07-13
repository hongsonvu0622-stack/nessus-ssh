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
      language: 'Ngôn ngữ (Language)'
    },
    // HostList
    hostList: {
      pageTitle: 'Kết Nối SSH & Serial',
      pageSubTitle: 'Quản lý máy chủ theo Thư mục Nhóm, nhập xuất bảng tính Excel & truy cập Terminal',
      byFolder: 'Theo Thư mục',
      allHostsGrid: 'Tất cả Host',
      createGroupBtn: '+ Tạo Thư mục Nhóm',
      searchPlaceholder: 'Tìm kiếm máy chủ, IP, nhãn hoặc nhóm...',
      newConnection: 'Thêm Máy Chủ',
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
      language: 'Language'
    },
    // HostList
    hostList: {
      pageTitle: 'SSH & Serial Connections',
      pageSubTitle: 'Manage servers by group folders, import/export Excel spreadsheets & launch terminals',
      byFolder: 'By Folder',
      allHostsGrid: 'All Hosts',
      createGroupBtn: '+ New Group',
      searchPlaceholder: 'Search servers, IP, tags or groups...',
      newConnection: 'New Connection',
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
    }
  }
};
