//
//  MessageInputVM.swift
//  GeminiForMac
//
//  Created by LJJ on 2025/7/12.
//

import Foundation
import SwiftUI
import Factory

@MainActor
class MessageInputVM: ObservableObject {
    @Injected(\.fileExplorerService) private var fileExplorerService
    @Injected(\.chatService) private var chatService
    
    @Published var messageText: String = "" {
        didSet {
            calculateTextHeight()
        }
    }
    @Published var currentModel: ModelInfo?
    @Published var supportedModels: [ModelInfo] = []
    @Published var showModelMenu: Bool = false
    @Published var isLoadingModels: Bool = false
    @Published var textHeight: CGFloat = 20 // 动态文本高度
    
    private let minHeight: CGFloat = 20
    private let maxHeight: CGFloat = 100
    private let lineHeight: CGFloat = 20 // 估算的行高
    
    init() {
        Task {
            await fetchModelStatus()
        }
    }
    
    private func calculateTextHeight() {
        // 如果文本为空，使用最小高度
        if messageText.isEmpty {
            textHeight = minHeight
            return
        }
        
        // 使用更准确的方法计算文本高度
        let font = NSFont.systemFont(ofSize: NSFont.systemFontSize)
        let attributes = [NSAttributedString.Key.font: font]
        
        // 计算文本的边界，考虑实际可用宽度（减去padding和边框）
        let availableWidth: CGFloat = 300 - 16 // 假设总宽度300，减去左右padding
        let textSize = (messageText as NSString).boundingRect(
            with: CGSize(width: availableWidth, height: CGFloat.greatestFiniteMagnitude),
            options: [.usesLineFragmentOrigin, .usesFontLeading],
            attributes: attributes,
            context: nil
        )
        
        // 计算实际高度（包含padding）
        let calculatedHeight = textSize.height + 16 // 16是上下padding
        
        // 限制在最小和最大高度之间
        textHeight = max(minHeight, min(maxHeight, calculatedHeight))
    }
    
    func sendMessage() {
        let text = messageText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        
        messageText = ""
        
        Task {
            // 获取选中的文件路径
            let selectedFilePaths = Array(fileExplorerService.selectedFiles)
            
            // 发送消息（包含文件路径和工作目录）
            await chatService.sendMessage(text, filePaths: selectedFilePaths, workspacePath: fileExplorerService.currentPath)
        }
    }
    
    func fetchModelStatus() async {
        isLoadingModels = true
        
        do {
            let url = URL(string: APIConfig.URLs.modelStatus)!
            let (data, _) = try await URLSession.shared.data(from: url)
            
            let response = try JSONDecoder().decode(ModelStatusResponse.self, from: data)
            
            // 更新支持的模型列表
            supportedModels = response.data.supportedModels.map { model in
                ModelInfo(name: model.name, isAvailable: model.isAvailable)
            }
            
            // 更新当前模型
            currentModel = ModelInfo(name: response.data.currentModel, isAvailable: true)
            
        } catch {
            print("获取模型状态失败: \(error)")
            // 设置默认值
            currentModel = ModelInfo(name: "gemini-2.5-flash", isAvailable: true)
            supportedModels = [
                ModelInfo(name: "gemini-2.5-pro", isAvailable: false),
                ModelInfo(name: "gemini-2.5-flash", isAvailable: true)
            ]
        }
        
        isLoadingModels = false
    }
    
    func switchModel(to modelName: String) async {
        guard let targetModel = supportedModels.first(where: { $0.name == modelName }) else {
            return
        }
        
        do {
            let url = URL(string: APIConfig.URLs.modelSwitch)!
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            
            let body = ["model": modelName]
            request.httpBody = try JSONEncoder().encode(body)
            
            let (data, _) = try await URLSession.shared.data(for: request)
            let response = try JSONDecoder().decode(ModelSwitchResponse.self, from: data)
            
            if response.success {
                currentModel = targetModel
                showModelMenu = false
            } else {
                print(response.message ?? "切换模型失败")
            }
            
        } catch {
            print("切换模型失败: \(error)")
        }
    }
}
