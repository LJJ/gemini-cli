import Foundation
import SwiftUI

@MainActor
class ChatHistoryVM: ObservableObject {
    // MARK: - Published Properties (UI State)
    @Published var selectedFilter: ChatHistoryFilter = .all
    @Published var searchText = ""
    @Published var selectedHistory: ChatHistoryItem?
    @Published var showDeleteAlert = false
    @Published var historyToDelete: ChatHistoryItem?
    @Published var chatHistories: [ChatHistoryItem] = []
    
    // MARK: - Private Properties
    private let userDefaults = UserDefaults.standard
    private let chatHistoryKey = "ChatHistory"
    
    // MARK: - Computed Properties
    var filteredHistories: [ChatHistoryItem] {
        let filtered = getFilteredHistories(filter: selectedFilter)
        
        if searchText.isEmpty {
            return filtered
        } else {
            return filtered.filter { history in
                history.title.localizedCaseInsensitiveContains(searchText) ||
                history.lastMessage.localizedCaseInsensitiveContains(searchText)
            }
        }
    }
    
    var groupedHistories: [ChatHistorySection] {
        let grouped = Dictionary(grouping: filteredHistories) { history in
            Calendar.current.isDateInToday(history.lastMessageTimestamp) ? "今天" :
            Calendar.current.isDateInYesterday(history.lastMessageTimestamp) ? "昨天" :
            Calendar.current.isDate(history.lastMessageTimestamp, equalTo: Date(), toGranularity: .weekOfYear) ? "本周" :
            Calendar.current.isDate(history.lastMessageTimestamp, equalTo: Date(), toGranularity: .month) ? "本月" : "更早"
        }
        
        return grouped.map { key, values in
            ChatHistorySection(title: key, items: values)
        }.sorted { section1, section2 in
            let order = ["今天", "昨天", "本周", "本月", "更早"]
            let index1 = order.firstIndex(of: section1.title) ?? 999
            let index2 = order.firstIndex(of: section2.title) ?? 999
            return index1 < index2
        }
    }
    
    // MARK: - Initialization
    init() {
        loadChatHistories()
        
        // 添加一些测试数据（仅用于开发阶段）
        #if DEBUG
        if chatHistories.isEmpty {
            addSampleData()
        }
        #endif
    }
    
    // MARK: - Public Methods
    func selectHistory(_ history: ChatHistoryItem) {
        selectedHistory = history
        // 这里可以添加加载特定聊天历史的逻辑
    }
    
    func deleteHistory(_ history: ChatHistoryItem) {
        historyToDelete = history
        showDeleteAlert = true
    }
    
    func confirmDelete() {
        if let history = historyToDelete {
            chatHistories.removeAll { $0.id == history.id }
            if selectedHistory?.id == history.id {
                selectedHistory = nil
            }
            saveToUserDefaults()
            historyToDelete = nil
        }
        showDeleteAlert = false
    }
    
    func cancelDelete() {
        historyToDelete = nil
        showDeleteAlert = false
    }
    
    func clearAllHistories() {
        chatHistories.removeAll()
        selectedHistory = nil
        saveToUserDefaults()
    }
    
    func refreshHistories() {
        loadChatHistories()
    }
    
    func saveChatHistory(_ history: ChatHistoryItem) {
        chatHistories.insert(history, at: 0)
        saveToUserDefaults()
    }
    
    func updateChatHistory(_ history: ChatHistoryItem) {
        if let index = chatHistories.firstIndex(where: { $0.id == history.id }) {
            chatHistories[index] = history
            saveToUserDefaults()
        }
    }
    
    // MARK: - Private Methods
    private func loadChatHistories() {
        if let data = userDefaults.data(forKey: chatHistoryKey),
           let histories = try? JSONDecoder().decode([ChatHistoryItem].self, from: data) {
            chatHistories = histories.sorted { $0.timestamp > $1.timestamp }
        }
    }
    
    private func saveToUserDefaults() {
        if let data = try? JSONEncoder().encode(chatHistories) {
            userDefaults.set(data, forKey: chatHistoryKey)
        }
    }
    
    private func getFilteredHistories(filter: ChatHistoryFilter) -> [ChatHistoryItem] {
        switch filter {
        case .all:
            return chatHistories
        case .today:
            let today = Calendar.current.startOfDay(for: Date())
            return chatHistories.filter { Calendar.current.isDate($0.lastMessageTimestamp, inSameDayAs: today) }
        case .thisWeek:
            let weekAgo = Calendar.current.date(byAdding: .day, value: -7, to: Date()) ?? Date()
            return chatHistories.filter { $0.lastMessageTimestamp >= weekAgo }
        case .thisMonth:
            let monthAgo = Calendar.current.date(byAdding: .month, value: -1, to: Date()) ?? Date()
            return chatHistories.filter { $0.lastMessageTimestamp >= monthAgo }
        case .project(let projectId):
            return chatHistories.filter { $0.projectId == projectId }
        }
    }
    
    // MARK: - Utility Methods
    func formatTimestamp(_ history: ChatHistoryItem) -> String {
        let date = history.lastMessageTimestamp
        let formatter = DateFormatter()
        if Calendar.current.isDateInToday(date) {
            formatter.dateFormat = "HH:mm"
        } else if Calendar.current.isDateInYesterday(date) {
            formatter.dateFormat = "昨天 HH:mm"
        } else if Calendar.current.isDate(date, equalTo: Date(), toGranularity: .weekOfYear) {
            formatter.dateFormat = "EEEE HH:mm"
        } else {
            formatter.dateFormat = "MM-dd HH:mm"
        }
        return formatter.string(from: date)
    }
    
    func truncateMessage(_ message: String, maxLength: Int = 50) -> String {
        if message.count <= maxLength {
            return message
        } else {
            return String(message.prefix(maxLength)) + "..."
        }
    }
    
    // MARK: - Debug Methods
    private func addSampleData() {
        let sampleHistories = [
            ChatHistoryItem(
                title: "项目代码审查",
                timestamp: Date(),
                messages: [
                    ChatMessage(content: "请帮我检查这段代码的性能问题", type: .user),
                    ChatMessage(content: "我来帮你分析这段代码的性能问题...", type: .text),
                    ChatMessage(content: "根据分析，这里有几个可以优化的地方...", type: .text)
                ],
                projectId: "gemini-cli"
            ),
            ChatHistoryItem(
                title: "API接口设计",
                timestamp: Calendar.current.date(byAdding: .hour, value: -2, to: Date()) ?? Date(),
                messages: [
                    ChatMessage(content: "这个接口的返回格式需要调整", type: .user),
                    ChatMessage(content: "好的，我来帮你重新设计API接口的返回格式...", type: .text)
                ],
                projectId: "api-service"
            ),
            ChatHistoryItem(
                title: "数据库优化",
                timestamp: Calendar.current.date(byAdding: .day, value: -1, to: Date()) ?? Date(),
                messages: [
                    ChatMessage(content: "查询性能已经提升了30%", type: .text),
                    ChatMessage(content: "太好了！具体是怎么优化的？", type: .user)
                ],
                projectId: "database"
            ),
            ChatHistoryItem(
                title: "UI组件开发",
                timestamp: Calendar.current.date(byAdding: .day, value: -3, to: Date()) ?? Date(),
                messages: [
                    ChatMessage(content: "组件已经完成，可以开始集成测试", type: .text),
                    ChatMessage(content: "好的，我来准备测试用例", type: .user)
                ],
                projectId: "ui-components"
            )
        ]
        
        for history in sampleHistories {
            saveChatHistory(history)
        }
    }
}
