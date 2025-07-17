//
//  ChatService.swift
//  GeminiForMac
//
//  Created by LJJ on 2025/7/4.
//

import Foundation
import SwiftUI
import Factory

@MainActor
class ChatService: ObservableObject {
    @Published var messages: [ChatMessage] = []
    @Published var isConnected = false
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var pendingToolConfirmation: ToolConfirmationEvent?
    @Published var showToolConfirmation = false
    @Published var statusMessage: String? // 新增：用于显示动态状态消息
    @Published var showProjectConfiguration = false // 新增：用于显示项目配置弹窗
    @Published var projectConfigurationMessage: String = "" // 新增：项目配置错误消息
    
    // Workspace信息
    @Published var currentWorkspace: String = ""
    @Published var currentPath: String = ""
    
    // 工具确认队列
    private var toolConfirmationQueue: [ToolConfirmationEvent] = []
    private var isProcessingConfirmation = false
    
    private let apiService = APIService()
    
    init() {
        // 添加欢迎消息
        messages.append(ChatMessage(
            content: String(localized: "你好！我是 Gemini CLI 助手。我可以帮助你编写代码、回答问题或执行各种任务。\n\n💡 提示：你可以在文件浏览器中选择文件，然后发送消息时我会自动包含文件内容进行分析。"),
            type: .text // 修改为 .text
        ))
    }
    
    // 检查连接状态
    func checkConnection() async {
        isConnected = await apiService.checkServerStatus()
        if !isConnected {
            errorMessage = String(localized: "无法连接到 Gemini CLI 服务器。请确保服务器正在运行。")
        } else {
            errorMessage = nil
        }
    }
    
    // 发送消息（带文件路径和工作目录）
    func sendMessage(_ text: String, filePaths: [String] = [], workspacePath: String? = nil) async {
        guard !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        
        // 添加用户消息
        let userMessage = ChatMessage(content: text, type: .user)
        messages.append(userMessage)
        
        // 如果有文件路径，添加一个系统消息显示文件信息
        if !filePaths.isEmpty {
            statusMessage = String(format: String(localized: "📎 已选择 %d 个文件进行分析"), filePaths.count) // 修改为更新 statusMessage
        }
        
        isLoading = true
        errorMessage = nil
        statusMessage = String(localized: "正在处理...") // 添加此行
        
        do {
            // 统一使用流式响应，让 AI 自动决定是否需要交互式处理
            let stream = await apiService.sendMessageStream(text, filePaths: filePaths, workspacePath: workspacePath)
            
            for try await chunk in stream {
                // 解析结构化事件
                if let event = parseStructuredEvent(chunk) {
                    handleStructuredEvent(event)
                } else {
                    // 如果不是结构化事件，记录错误
                    print(String(format: String(localized: "收到非结构化响应: %@"), chunk))
                }
            }
        } catch {
            errorMessage = String(format: String(localized: "发送消息时发生错误: %@"), error.localizedDescription)
        }
        
        isLoading = false
        if statusMessage == String(localized: "正在处理...") { // 检查是否是“正在处理...”消息
            statusMessage = nil // 清空状态消息
        }
    }
    
    // 解析结构化事件
    private func parseStructuredEvent(_ chunk: String) -> StreamEvent? {
        return StreamEvent.parse(from: chunk)
    }
    
    // 处理结构化事件
    private func handleStructuredEvent(_ event: StreamEvent) {
        switch event.data {
        case .content(let data):
            // 处理文本内容
            if let lastIndex = messages.indices.last, messages.last?.type == .text {
                messages[lastIndex] = ChatMessage(
                    content: messages[lastIndex].content + data.text,
                    type: .text,
                    timestamp: messages[lastIndex].timestamp
                )
            } else {
                messages.append(ChatMessage(content: data.text, type: .text))
            }
            
        case .thought(let data):
            // 处理思考过程 - 更新 statusMessage
            statusMessage = String(format: String(localized: "💭 **%@**\n%@"), data.subject, data.description)
            
        case .toolCall(let data):
            // 处理工具调用 - 更新 statusMessage
            statusMessage = String(format: String(localized: "🔧 正在调用工具: %@"), data.displayName)
            
        case .toolExecution(let data):
            // 处理工具执行状态 - 更新 statusMessage
            statusMessage = String(format: String(localized: "⚡ %@"), data.message)
            
        case .toolResult(let data):
            // 处理工具执行结果 - 更新 statusMessage
            statusMessage = data.displayResult
            
        case .toolConfirmation(let data):
            // 处理工具确认请求 - 添加到队列
            print("收到工具请求，\(data)")
            
            // 根据工具名称确定确认类型
            let confirmationType: ToolConfirmationType
            switch data.name {
            case .writeFile, .replace, .edit:
                confirmationType = .edit
            case .executeCommand, .runShellCommand:
                confirmationType = .exec
            default:
                confirmationType = .info
            }
            
            let confirmationEvent = ToolConfirmationEvent(
                type: "tool_confirmation",
                callId: data.callId,
                toolName: data.name,
                confirmationDetails: ToolConfirmationDetails(
                    type: confirmationType,
                    title: String(format: String(localized: "需要确认工具调用: %@"), data.displayName),
                    command: data.args.command,
                    rootCommand: nil,
                    fileName: data.args.filePath ?? "",
                    oldStr: data.args.oldString,
                    newStr: data.args.newString,
                    content: data.args.content,
                    prompt: data.prompt,
                    urls: nil,
                    serverName: nil,
                    toolName: data.name,
                    toolDisplayName: data.displayName,
                    description: data.args.description
                )
            )
            addToolConfirmationToQueue(confirmationEvent)
            
        case .workspace(let data):
            // 处理工作区事件 - 更新workspace信息
            print(String(format: String(localized: "收到工作区事件: workspace=%@, currentPath=%@"), data.workspacePath, data.currentPath))
            currentWorkspace = data.workspacePath
            currentPath = data.currentPath
            
        case .error(let data):
            // 处理错误 - 使用新的错误代码系统
            handleErrorEvent(data)
            
        case .complete(let data):
            // 处理完成事件 - 清空 statusMessage
            print("chat complete")
            statusMessage = nil // 清空状态消息
        }
    }
    
    func merge(message:ChatMessage){
        if let lastIndex = messages.indices.last, messages.last?.type == message.type {
            messages[lastIndex] = message
        } else {
            messages.append(message)
        }
    }
    
    // MARK: - 工具确认队列管理
    
    // 添加工具确认到队列
    private func addToolConfirmationToQueue(_ confirmation: ToolConfirmationEvent) {
        toolConfirmationQueue.append(confirmation)
        processNextConfirmation()
    }
    
    // 处理队列中的下一个确认
    private func processNextConfirmation() {
        guard !isProcessingConfirmation, !toolConfirmationQueue.isEmpty else { return }
        
        isProcessingConfirmation = true
        pendingToolConfirmation = toolConfirmationQueue.removeFirst()
        showToolConfirmation = true
    }
    
    // 获取当前队列状态
    var hasPendingConfirmations: Bool {
        return !toolConfirmationQueue.isEmpty || pendingToolConfirmation != nil
    }
    
    // 获取队列中等待的确认数量
    var pendingConfirmationCount: Int {
        return toolConfirmationQueue.count + (pendingToolConfirmation != nil ? 1 : 0)
    }
    
    // 清空所有待处理的确认
    func clearAllConfirmations() {
        toolConfirmationQueue.removeAll()
        pendingToolConfirmation = nil
        showToolConfirmation = false
        isProcessingConfirmation = false
    }

    
    // 处理工具确认
    func handleToolConfirmation(outcome: ToolConfirmationOutcome) async {
        guard let confirmation = pendingToolConfirmation else { return }
        
        print(String(format: String(localized: "tool call confirmed %@"), String(describing: outcome)))
        
        // 发送确认到服务器
        if let response = await apiService.sendToolConfirmation(
            callId: confirmation.callId,
            outcome: outcome
        ) {
            // 工具确认成功（服务器返回了响应就表示成功）
            // 只有在不是取消的情况下才显示成功消息
            if outcome != .cancel {
                // 等待一段时间，让服务器处理工具调用
                try? await Task.sleep(nanoseconds: 1_000_000_000) // 1秒
                
                // 更新消息状态
                statusMessage = String(localized: "✅ 工具调用执行完成")
                // 等待一段时间，让用户看到状态，然后清空
                try? await Task.sleep(nanoseconds: 1_000_000_000) // 1秒
                statusMessage = nil
            }
        } else {
            errorMessage = String(localized: "发送确认失败，请检查网络连接。")
        }
        
        // 清除当前确认状态
        pendingToolConfirmation = nil
        showToolConfirmation = false
        isProcessingConfirmation = false
        
        // 处理队列中的下一个确认
        try? await Task.sleep(nanoseconds: 500_000_000) // 0.5秒
        processNextConfirmation()
    }
    
    // 取消工具确认
    func cancelToolConfirmation() {
        pendingToolConfirmation = nil
        showToolConfirmation = false
        isProcessingConfirmation = false
        statusMessage = nil // 确保状态消息被清除
        
        // 处理队列中的下一个确认
        processNextConfirmation()
    }
    
    // 发送消息（重载，兼容原有调用）
    func sendMessage(_ text: String) async {
        await sendMessage(text, filePaths: [], workspacePath: nil)
    }
    
    // 取消当前聊天
    func cancelChat() async {
        print("ChatService: 正在发送取消聊天请求...")
        isLoading = false // 停止加载指示器
        statusMessage = String(localized: "正在取消...") // 显示取消状态
        do {
            // 发送取消请求到后端
            let response = await apiService.sendPostRequest(path: "/cancelChat", body: [String: Any]())
            if response?.code == 200 {
                print("ChatService: 聊天取消请求发送成功")
                // 成功发送取消请求后，清除所有待处理的工具确认
                clearAllConfirmations()
                // UI状态的最终更新将由后端发送的流事件（例如错误事件）来处理
            } else {
                let errorMessage = response?.message ?? String(localized: "未知错误")
                self.errorMessage = String(format: String(localized: "取消聊天失败: %@"), errorMessage)
                print(String(format: String(localized: "ChatService: 取消聊天失败: %@"), errorMessage))
            }
        } catch {
            self.errorMessage = String(format: String(localized: "取消聊天时发生网络错误: %@"), error.localizedDescription)
            print(String(format: String(localized: "ChatService: 取消聊天时发生网络错误: %@"), error.localizedDescription))
        }
        // 不再在这里直接清除 statusMessage 或修改 messages，
        // 而是等待后端流的事件来更新最终状态。
        // 如果后端发送了 complete 事件，statusMessage 会被清空。
        // 如果后端发送了 error 事件（例如用户取消），errorMessage 会被设置。
    }

    // 清除消息
    func clearMessages() {
        messages.removeAll()
        // 重新添加欢迎消息
        messages.append(ChatMessage(
            content: String(localized: "你好！我是 Gemini CLI 助手。我可以帮助你编写代码、回答问题或执行各种任务。\n\n💡 提示：你可以在文件浏览器中选择文件，然后发送消息时我会自动包含文件内容进行分析。"),
            type: .text // 修改为 .text
        ))
    }
    
    // MARK: - 错误处理
    
    /// 处理错误事件 - 使用新的错误代码系统
    private func handleErrorEvent(_ errorData: ErrorEventData) {
        // 记录错误日志
        print("收到错误事件: \(errorData.code) - \(errorData.message)")
        
        // 优先显示服务器传递的详细错误消息，如果没有则使用本地化的用户友好消息
        let userMessage = errorData.message.isEmpty ? errorData.userFriendlyMessage : errorData.message
        self.errorMessage = userMessage
        
        // 根据错误类型执行相应的处理逻辑
        if errorData.requiresReauthentication {
            // 触发重新认证流程
            handleReauthenticationError()
        } else if errorData.requiresProjectConfiguration {
            // 触发项目配置弹窗
            handleProjectConfigurationError(errorData)
        } else if errorData.requiresNetworkCheck {
            // 提示用户检查网络
            handleNetworkError()
        } else if errorData.requiresRetry {
            // 提示用户重试
            handleRetryableError()
        } else if errorData.requiresInputValidation {
            // 提示用户检查输入
            handleValidationError()
        }
    }
    
    /// 处理需要重新认证的错误
    private func handleReauthenticationError() {
        print("需要重新认证")
        
        // 使用依赖注入获取 AuthService 并打开认证对话框
        let authService = Container.shared.authService.resolve()
        authService.openAuthDialog()
        
        // 添加一个系统消息提示用户
        let authMessage = ChatMessage(
            content: String(localized: "🔐 检测到认证问题，请重新进行认证设置"),
            type: .text // 修改为 .text
        )
        messages.append(authMessage)
    }
    
    /// 处理需要项目配置的错误
    private func handleProjectConfigurationError(_ errorData: ErrorEventData) {
        print("需要配置Google Cloud Project")
        
        // 设置项目配置错误消息
        projectConfigurationMessage = errorData.message
        
        // 显示项目配置弹窗
        showProjectConfiguration = true
        
        // 添加一个系统消息提示用户
        let configMessage = ChatMessage(
            content: String(localized: "⚙️ 需要配置 Google Cloud Project，请在弹窗中完成设置"),
            type: .text
        )
        messages.append(configMessage)
    }
    
    /// 处理网络相关错误
    private func handleNetworkError() {
        // TODO: 实现网络错误处理
        print("网络连接问题")
        // 可以在这里显示网络状态或提供重连选项
    }
    
    /// 处理可重试的错误
    private func handleRetryableError() {
        // TODO: 实现重试逻辑
        print("可以重试的错误")
        // 可以在这里提供重试按钮或自动重试
    }
    
    /// 处理输入验证错误
    private func handleValidationError() {
        // TODO: 实现输入验证错误处理
        print("输入参数问题")
        // 可以在这里提示用户检查输入
    }
}
