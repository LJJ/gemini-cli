import Foundation

struct ModelInfo {
    let name: String
    let isAvailable: Bool
    let displayName: String

    init(name: String, isAvailable: Bool) {
        self.name = name
        self.isAvailable = isAvailable
        self.displayName = name == "gemini-2.5-pro" ? "Gemini Pro" : "Gemini Flash"
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
