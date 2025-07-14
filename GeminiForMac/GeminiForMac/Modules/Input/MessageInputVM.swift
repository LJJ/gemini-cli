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
    private let apiService = APIService()
    
    @Published var messageText: String = "" {
        didSet {
            calculateTextHeight()
        }
    }
    @Published var currentModel: ModelInfo?
    @Published var supportedModels: [ModelInfo] = []
    @Published var showModelMenu: Bool = false
    @Published var isLoadingModels: Bool = false
    @Published var textHeight: CGFloat = 30 // 动态文本高度
    
    private let minHeight: CGFloat = 30 // 单行高度
    private let maxHeight: CGFloat = 100
    private let padding: CGFloat = 16 // 上下padding总计
    private var currentTextWidth: CGFloat = 300 // 当前可用文本宽度
    
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
        
        // 使用TextEditor实际使用的字体（系统字体）
        let font = NSFont.systemFont(ofSize: 13) // TextEditor默认字体大小
        let attributes: [NSAttributedString.Key: Any] = [
            .font: font
        ]
        
        // 计算可用宽度（减去左右padding）
        let availableWidth = currentTextWidth - padding
        
        // 计算文本尺寸
        let textSize = (messageText as NSString).boundingRect(
            with: CGSize(width: availableWidth, height: CGFloat.greatestFiniteMagnitude),
            options: [.usesLineFragmentOrigin, .usesFontLeading],
            attributes: attributes,
            context: nil
        )
        
        // 计算实际高度（文本高度 + 上下padding）
        let calculatedHeight = ceil(textSize.height) + padding
        
        // 限制在最小和最大高度之间
        textHeight = max(minHeight, min(maxHeight, calculatedHeight))
    }
    
    func updateTextWidth(_ width: CGFloat) {
        currentTextWidth = width
        calculateTextHeight()
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
            // 使用 APIService 的底层方法
            let baseResponse: BaseResponse<ModelStatusData>? = await apiService.getRequest(path: "/model/status")
            
            if let response = baseResponse {
                // 更新支持的模型列表 - 使用 modelStatuses 来获取可用性信息
                supportedModels = response.data.modelStatuses.map { modelStatus in
                    ModelInfo(name: modelStatus.name, isAvailable: modelStatus.available)
                }
                
                // 更新当前模型
                currentModel = ModelInfo(name: response.data.currentModel, isAvailable: true)
                print(currentModel)
            } else {
                // 设置默认值
                currentModel = ModelInfo(name: "gemini-2.5-flash", isAvailable: true)
                supportedModels = [
                    ModelInfo(name: "gemini-2.5-pro", isAvailable: false),
                    ModelInfo(name: "gemini-2.5-flash", isAvailable: true)
                ]
            }
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
            // 使用 APIService 的底层方法
            let body: [String: Any] = ["model": modelName]
            let baseResponse: BaseResponse<ModelSwitchData>? = await apiService.postRequest(path: "/model/switch", body: body)
            
            if let response = baseResponse {
                currentModel = targetModel
                showModelMenu = false
            } else {
                print("切换模型失败")
            }
            
        } catch {
            print("切换模型失败: \(error)")
        }
    }
}
