import Foundation

struct ModelInfo {
    let name: String
    let isAvailable: Bool
    let displayName: String

    init(name: String, isAvailable: Bool) {
        self.name = name
        self.isAvailable = isAvailable
        self.displayName = Self.getDisplayName(for: name)
    }
    
    private static func getDisplayName(for modelName: String) -> String {
        switch modelName {
        case "gemini-2.5-pro":
            return "Gemini 2.5 Pro"
        case "gemini-2.5-flash":
            return "Gemini 2.5 Flash"
        case "gemini-2.5-flash-lite":
            return "Gemini 2.5 Flash Lite"
        default:
            return modelName
        }
    }
}

struct ModelStatusData: Codable {
    let currentModel: String
    let supportedModels: [String]  // 修改为字符串数组，匹配服务器端响应
    let modelStatuses: [ModelStatus]  // 添加模型状态数组
}

struct ModelStatus: Codable {
    let name: String
    let available: Bool
    let status: String
    let message: String
}

struct SupportedModel: Codable {
    let name: String
    let isAvailable: Bool
}

// 模型切换响应数据（用于BaseResponse<T>的泛型参数）
struct ModelSwitchData: Codable {
    let model: ModelSwitchInfo
}

struct ModelSwitchInfo: Codable {
    let name: String
    let previousModel: String
    let switched: Bool
    let available: Bool?
    let status: String?
    let availabilityMessage: String?
} 
