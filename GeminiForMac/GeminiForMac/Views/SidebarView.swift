import SwiftUI

// 导入需要的模块视图
// 注意：这里假设FileExplorerView和ChatHistoryView在同一个模块中
// 如果不在，需要调整import路径

enum SidebarTab: String, CaseIterable {
    case fileExplorer = "fileExplorer"
    case chatHistory = "chatHistory"
    
    var title: String {
        switch self {
        case .fileExplorer:
            return "File"
        case .chatHistory:
            return "History(fake)"
        }
    }
    
    var icon: String {
        switch self {
        case .fileExplorer:
            return "folder"
        case .chatHistory:
            return "message.circle"
        }
    }
}

struct SidebarView: View {
    @Binding var selectedTab: SidebarTab
    
    var body: some View {
        VStack(spacing: 0) {
            // Tab栏
            HStack(spacing: 0) {
                ForEach(SidebarTab.allCases, id: \.self) { tab in
                    Button(action: {
                        selectedTab = tab
                    }) {
                        VStack(spacing: 4) {
                            Image(systemName: tab.icon)
                                .font(.title2)
                            
                            Text(tab.title)
                                .font(.caption)
                        }
                        .foregroundColor(selectedTab == tab ? .blue : .secondary)
                        .frame(width: 80, height: 60)
                        .background(selectedTab == tab ? Color.blue.opacity(0.1) : Color.clear)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(PlainButtonStyle())
                }
                
                Spacer()
            }
            .background(Color(NSColor.controlBackgroundColor))
            
            // 分隔线
            Divider()
            
            // 内容区域
            Group {
                switch selectedTab {
                case .fileExplorer:
                    FileExplorerView()
                case .chatHistory:
                    ChatHistoryView()
                }
            }
        }
        .frame(minWidth: 200, idealWidth: 300, maxWidth: 500)
    }
}

#Preview {
    SidebarView(selectedTab: .constant(.fileExplorer))
}
