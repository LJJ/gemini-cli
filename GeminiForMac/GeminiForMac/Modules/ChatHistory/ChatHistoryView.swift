import SwiftUI

struct ChatHistoryView: View {
    @StateObject private var viewModel = ChatHistoryVM()
    
    var body: some View {
        VStack(spacing: 0) {
            // 标题栏
            HStack {
                Text("聊天历史")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Spacer()
                
                Menu {
                    Button("全部") {
                        viewModel.selectedFilter = .all
                    }
                    Button("今天") {
                        viewModel.selectedFilter = .today
                    }
                    Button("本周") {
                        viewModel.selectedFilter = .thisWeek
                    }
                    Button("本月") {
                        viewModel.selectedFilter = .thisMonth
                    }
                } label: {
                    Image(systemName: "line.3.horizontal.decrease.circle")
                        .foregroundColor(.secondary)
                }
                
                Button(action: {
                    viewModel.refreshHistories()
                }) {
                    Image(systemName: "arrow.clockwise")
                        .foregroundColor(.secondary)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Color(NSColor.controlBackgroundColor))
            
            // 搜索栏
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.secondary)
                
                TextField("搜索聊天历史...", text: $viewModel.searchText)
                    .textFieldStyle(PlainTextFieldStyle())
                
                if !viewModel.searchText.isEmpty {
                    Button(action: {
                        viewModel.searchText = ""
                    }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Color(NSColor.controlBackgroundColor))
            .cornerRadius(8)
            .padding(.horizontal, 16)
            .padding(.bottom, 8)
            
            // 聊天历史列表
            if viewModel.groupedHistories.isEmpty {
                VStack(spacing: 16) {
                    Image(systemName: "message.circle")
                        .font(.system(size: 48))
                        .foregroundColor(.secondary)
                    
                    Text("暂无聊天历史")
                        .font(.headline)
                        .foregroundColor(.secondary)
                    
                    Text("开始新的对话来创建聊天历史")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollView {
                    LazyVStack(spacing: 0) {
                        ForEach(viewModel.groupedHistories) { section in
                            VStack(alignment: .leading, spacing: 0) {
                                // 分组标题
                                Text(section.title)
                                    .font(.caption)
                                    .fontWeight(.medium)
                                    .foregroundColor(.secondary)
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 8)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(Color(NSColor.controlBackgroundColor))
                                
                                // 分组内容
                                ForEach(section.items) { history in
                                    ChatHistoryItemView(
                                        history: history,
                                        isSelected: viewModel.selectedHistory?.id == history.id,
                                        onSelect: {
                                            viewModel.selectHistory(history)
                                        },
                                        onDelete: {
                                            viewModel.deleteHistory(history)
                                        },
                                        formatTimestamp: { viewModel.formatTimestamp(history) },
                                        truncateMessage: viewModel.truncateMessage
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
        .alert("删除聊天历史", isPresented: $viewModel.showDeleteAlert) {
            Button("取消", role: .cancel) {
                viewModel.cancelDelete()
            }
            Button("删除", role: .destructive) {
                viewModel.confirmDelete()
            }
        } message: {
            Text("确定要删除这个聊天历史吗？此操作无法撤销。")
        }
    }
}

struct ChatHistoryItemView: View {
    let history: ChatHistoryItem
    let isSelected: Bool
    let onSelect: () -> Void
    let onDelete: () -> Void
    let formatTimestamp: () -> String
    let truncateMessage: (String, Int) -> String
    
    var body: some View {
        HStack(spacing: 12) {
            // 聊天图标
            Image(systemName: "message.circle.fill")
                .font(.title2)
                .foregroundColor(.blue)
            
            // 聊天信息
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(history.title)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .lineLimit(1)
                    
                    Spacer()
                    
                    Text(formatTimestamp())
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Text(truncateMessage(history.lastMessage, 40))
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
                
                HStack {
                    Text("\(history.messageCount) 条消息")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    if let projectId = history.projectId {
                        Text("项目: \(projectId)")
                            .font(.caption2)
                            .foregroundColor(.blue)
                    }
                }
            }
            
            // 删除按钮
            Button(action: onDelete) {
                Image(systemName: "trash")
                    .font(.caption)
                    .foregroundColor(.red)
            }
            .buttonStyle(PlainButtonStyle())
            .opacity(isSelected ? 1 : 0)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(isSelected ? Color.blue.opacity(0.1) : Color.clear)
        .contentShape(Rectangle())
        .onTapGesture {
            onSelect()
        }
        .onHover { hovering in
            // 可以在这里添加悬停效果
        }
    }
}

#Preview {
    ChatHistoryView()
}
