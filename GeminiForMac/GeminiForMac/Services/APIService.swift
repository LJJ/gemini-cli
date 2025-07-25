//
//  APIService.swift
//  GeminiForMac
//
//  Created by LJJ on 2025/7/9.
//

import Foundation

// MARK: - API服务类
final class APIService: Sendable {
    private let baseURL = APIConfig.baseURL  // 使用 APIConfig 的配置
    private let decoder: JSONDecoder
    
    init() {
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        self.decoder = decoder
    }
    
    // MARK: - 统一的请求方法
    
    /// 统一的GET请求方法
    /// - Parameters:
    ///   - path: API路径（不包含baseURL）
    ///   - queryItems: 查询参数（可选）
    /// - Returns: 解码后的响应数据
    func getRequest<T: Codable>(path: String, queryItems: [URLQueryItem]? = nil) async -> T? {
        var urlComponents = URLComponents(string: "\(baseURL)\(path)")
        if let queryItems = queryItems {
            urlComponents?.queryItems = queryItems
        }
        
        guard let url = urlComponents?.url else {
            print("❌ 无法创建URL: \(path)")
            return nil
        }
        
        do {
            let (data, response) = try await URLSession.shared.data(from: url)
            
            // Debug环境下打印响应信息
            #if DEBUG
            if let httpResponse = response as? HTTPURLResponse {
                print("🌐 GET \(path)")
                print("📡 状态码: \(httpResponse.statusCode)")
                print("📄 响应数据: \(String(data: data, encoding: .utf8) ?? "无法解码")")
            }
            #endif
            
            return try decoder.decode(T.self, from: data)
        } catch {
            print("❌ GET请求失败 \(path): \(error)")
            return nil
        }
    }
    
    /// 统一的POST请求方法
    /// - Parameters:
    ///   - path: API路径（不包含baseURL）
    ///   - body: 请求体数据
    /// - Returns: 解码后的响应数据
    func postRequest<T: Codable>(path: String, body: [String: Any]) async -> T? {
        guard let url = URL(string: "\(baseURL)\(path)") else {
            print("❌ 无法创建URL: \(path)")
            return nil
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        } catch {
            print("❌ 序列化请求体失败: \(error)")
            return nil
        }
        
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            
            // Debug环境下打印响应信息
            #if DEBUG
            if let httpResponse = response as? HTTPURLResponse {
                print("🌐 POST \(path)")
                print("📡 状态码: \(httpResponse.statusCode)")
                print("📤 请求体: \(body)")
                print("📄 响应数据: \(String(data: data, encoding: .utf8) ?? "无法解码")")
            }
            #endif
            
            return try decoder.decode(T.self, from: data)
        } catch {
            print("❌ POST请求失败 \(path): \(error)")
            return nil
        }
    }
    
    // MARK: - 服务器状态检查
    
    // 检查服务器状态
    func checkServerStatus() async -> Bool {
        guard let url = URL(string: "\(baseURL)/status") else { return false }
        
        do {
            let (_, response) = try await URLSession.shared.data(from: url)
            return (response as? HTTPURLResponse)?.statusCode == 200
        } catch {
            return false
        }
    }
    
    // MARK: - 聊天功能
    
    // 发送消息（统一使用流式响应，让 AI 自动决定是否需要交互式处理）
    func sendMessage(_ text: String, filePaths: [String] = [], workspacePath: String? = nil) async -> ChatResponseData? {
        var body: [String: Any] = ["message": text]
        
        if !filePaths.isEmpty {
            body["filePaths"] = filePaths
        }
        if let workspacePath = workspacePath, !workspacePath.isEmpty {
            body["workspacePath"] = workspacePath
        }
        
        let baseResponse: BaseResponse<ChatResponseData>? = await postRequest(path: "/chat", body: body)
        return baseResponse?.data
    }
    
    // 发送消息（流式响应）- 现在这是唯一的方式
    func sendMessageStream(_ text: String, filePaths: [String] = [], workspacePath: String? = nil) async -> AsyncThrowingStream<String, Error> {
        return AsyncThrowingStream { continuation in
            Task {
                guard let url = URL(string: "\(baseURL)/chat") else {
                    continuation.finish(throwing: URLError(.badURL))
                    return
                }
                
                var request = URLRequest(url: url)
                request.httpMethod = "POST"
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                
                var body: [String: Any] = ["message": text]
                
                if !filePaths.isEmpty {
                    body["filePaths"] = filePaths
                }
                if let workspacePath = workspacePath, !workspacePath.isEmpty {
                    body["workspacePath"] = workspacePath
                }
                
                request.httpBody = try? JSONSerialization.data(withJSONObject: body)
                
                do {
                    let (result, _) = try await URLSession.shared.bytes(for: request)
                    
                    for try await line in result.lines {
                        if !line.isEmpty {
                            continuation.yield(line)
                        }
                    }
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
        }
    }
    
    // 发送工具确认
    func sendToolConfirmation(callId: String, outcome: ToolConfirmationOutcome) async -> ToolConfirmationData? {
        let body: [String: Any] = [
            "callId": callId,
            "outcome": outcome.rawValue
        ]
        
        let baseResponse: BaseResponse<ToolConfirmationData>? = await postRequest(path: "/tool-confirmation", body: body)
        return baseResponse?.data
    }
    
    // MARK: - 认证功能
    
    // 设置认证配置
    func setAuthConfig(authType: AuthType, apiKey: String? = nil, googleCloudProject: String? = nil, googleCloudLocation: String? = nil) async -> AuthResponseData? {
        var body: [String: Any] = ["authType": authType.rawValue]
        
        if let apiKey = apiKey, !apiKey.isEmpty {
            body["apiKey"] = apiKey
        }
        if let googleCloudProject = googleCloudProject, !googleCloudProject.isEmpty {
            body["googleCloudProject"] = googleCloudProject
        }
        if let googleCloudLocation = googleCloudLocation, !googleCloudLocation.isEmpty {
            body["googleCloudLocation"] = googleCloudLocation
        }
        
        let baseResponse: BaseResponse<AuthResponseData>? = await postRequest(path: "/auth/config", body: body)
        return baseResponse?.data
    }
    
    // 启动 Google 登录
    func startGoogleLogin() async -> AuthResponseData? {
        print("发送 Google 登录请求...")
        
        let baseResponse: BaseResponse<AuthResponseData>? = await postRequest(path: "/auth/google-login", body: [:])
        
        if let data = baseResponse?.data {
            print("Google 登录响应解析成功: \(data)")
        }
        
        return baseResponse?.data
    }
    
    // 获取 Google 授权 URL（用于 code 登录流程）
    func getGoogleAuthUrl() async -> GoogleAuthUrlData? {
        print("发送获取 Google 授权 URL 请求...")
        
        let baseResponse: BaseResponse<GoogleAuthUrlData>? = await postRequest(path: "/auth/google-auth-url", body: [:])
        
        if let data = baseResponse?.data {
            print("Google 授权 URL 响应解析成功: \(data)")
        }
        
        return baseResponse?.data
    }
    
    // 提交 Google 授权码（用于 code 登录流程）
    func submitGoogleAuthCode(code: String) async -> AuthResponseData? {
        print("发送 Google 授权码请求...")
        
        let body: [String: Any] = ["code": code]
        let baseResponse: BaseResponse<AuthResponseData>? = await postRequest(path: "/auth/google-auth-code", body: body)
        
        if let data = baseResponse?.data {
            print("Google 授权码响应解析成功: \(data)")
        }
        
        return baseResponse?.data
    }
    
    // 获取认证状态
    func getAuthStatus() async -> AuthStatusData? {
        let baseResponse: BaseResponse<AuthStatusData>? = await getRequest(path: "/auth/status")
        return baseResponse?.data
    }
    
    // 登出
    func logout() async -> AuthResponseData? {
        let baseResponse: BaseResponse<AuthResponseData>? = await postRequest(path: "/auth/logout", body: [:])
        return baseResponse?.data
    }
    
    // 清除认证配置
    func clearAuth() async -> AuthResponseData? {
        let baseResponse: BaseResponse<AuthResponseData>? = await postRequest(path: "/auth/clear", body: [:])
        return baseResponse?.data
    }
    
    // MARK: - 文件操作功能
    
    // 列出目录内容
    func listDirectory(path: String = ".") async -> DirectoryData? {
        let queryItems = [URLQueryItem(name: "path", value: path)]
        let baseResponse: BaseResponse<DirectoryData>? = await getRequest(path: "/list-directory", queryItems: queryItems)
        return baseResponse?.data
    }
    
    // 读取文件内容
    func readFile(path: String) async -> FileData? {
        let body: [String: Any] = ["path": path]
        let baseResponse: BaseResponse<FileData>? = await postRequest(path: "/read-file", body: body)
        return baseResponse?.data
    }
    
    // 写入文件内容
    func writeFile(path: String, content: String) async -> FileData? {
        let body: [String: Any] = [
            "path": path,
            "content": content
        ]
        let baseResponse: BaseResponse<FileData>? = await postRequest(path: "/write-file", body: body)
        return baseResponse?.data
    }
    
    // 执行命令
    func executeCommand(command: String, cwd: String? = nil) async -> CommandData? {
        var body: [String: Any] = ["command": command]
        if let cwd = cwd, !cwd.isEmpty {
            body["cwd"] = cwd
        }
        
        let baseResponse: BaseResponse<CommandData>? = await postRequest(path: "/execute-command", body: body)
        return baseResponse?.data
    }
    
    // 搜索文件
    func searchFiles(query: String, currentPath: String, searchType: String? = nil, maxResults: Int? = nil) async -> DirectoryData? {
        var body: [String: Any] = [
            "query": query,
            "currentPath": currentPath
        ]
        
        if let searchType = searchType {
            body["searchType"] = searchType
        }
        if let maxResults = maxResults {
            body["maxResults"] = maxResults
        }
        
        let baseResponse: BaseResponse<DirectoryData>? = await postRequest(path: "/search-files", body: body)
        return baseResponse?.data
    }

    
    // 通用的 POST 请求方法（保留用于特殊需求）
    func sendPostRequest(path: String, body: [String: Any]) async -> BaseResponse<[String: String]>? {
        return await postRequest(path: path, body: body)
    }
}
