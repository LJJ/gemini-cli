import Foundation

// 导入ChatMessage类型
// 注意：ChatMessage定义在Models/ChatModels.swift中
struct ChatHistoryItem: Identifiable, Codable {
    let id: String
    let title: String
    let timestamp: Date
    let messages: [ChatMessage]  // 使用ChatMessage数组存储消息
    let projectId: String?
    
    init(id: String = UUID().uuidString, title: String, timestamp: Date = Date(), messages: [ChatMessage] = [], projectId: String? = nil) {
        self.id = id
        self.title = title
        self.timestamp = timestamp
        self.messages = messages
        self.projectId = projectId
    }
    
    // 计算属性
    var messageCount: Int {
        return messages.count
    }
    
    var lastMessage: String {
        return messages.last?.content ?? ""
    }
    
    var lastMessageTimestamp: Date {
        return messages.last?.timestamp ?? timestamp
    }
}

struct ChatHistorySection: Identifiable {
    let id: String
    let title: String
    let items: [ChatHistoryItem]
    
    init(title: String, items: [ChatHistoryItem]) {
        self.id = title
        self.title = title
        self.items = items
    }
}

enum ChatHistoryFilter {
    case all
    case today
    case thisWeek
    case thisMonth
    case project(String)
}
