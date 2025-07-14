//
//  APIConfig.swift
//  GeminiForMac
//
//  Created by LJJ on 2025/7/12.
//

import Foundation

struct APIConfig {
    // MARK: - 基础配置
    static let baseHost = "localhost"
    static let basePort = 8080  // 保持与当前实现一致
    static let baseScheme = "http"
    
    // MARK: - 基础URL
    static var baseURL: String {
        "\(baseScheme)://\(baseHost):\(basePort)"
    }
    
    // MARK: - API路径
    struct Paths {
        static let modelStatus = "/model/status"
        static let modelSwitch = "/model/switch"
        static let chat = "/chat"
        static let auth = "/auth"
        static let status = "/status"  // 添加状态检查路径
    }
    
    // MARK: - 完整URL
    struct URLs {
        static var modelStatus: String {
            "\(baseURL)\(Paths.modelStatus)"
        }
        
        static var modelSwitch: String {
            "\(baseURL)\(Paths.modelSwitch)"
        }
        
        static var chat: String {
            "\(baseURL)\(Paths.chat)"
        }
        
        static var auth: String {
            "\(baseURL)\(Paths.auth)"
        }
        
        static var status: String {
            "\(baseURL)\(Paths.status)"
        }
    }
    
    // MARK: - 环境配置
    enum Environment {
        case development
        case production
        case local
        
        var config: (host: String, port: Int, scheme: String) {
            switch self {
            case .development:
                return ("localhost", 8080, "http")
            case .production:
                return ("localhost", 8080, "http")  // 生产环境也使用 8080
            case .local:
                return ("localhost", 3000, "http")
            }
        }
    }
    
    // MARK: - 当前环境
    static let currentEnvironment: Environment = .production  // 改为生产环境
    
    // MARK: - 环境相关的URL
    static var environmentBaseURL: String {
        let config = currentEnvironment.config
        return "\(config.scheme)://\(config.host):\(config.port)"
    }
    
    // MARK: - 便利方法
    static func fullURL(for path: String) -> String {
        return "\(baseURL)\(path)"
    }
    
    static func environmentURL(for path: String) -> String {
        return "\(environmentBaseURL)\(path)"
    }
} 