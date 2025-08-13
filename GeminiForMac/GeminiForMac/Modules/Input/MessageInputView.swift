//
//  MessageInputView.swift
//  GeminiForMac
//
//  Created by LJJ on 2025/7/4.
//

import SwiftUI
import Factory

struct MessageInputView: View {
    @ObservedObject private var chatService = Container.shared.chatService.resolve()
    @StateObject private var messageInputVM = MessageInputVM()
    @State private var dynamicHeight: CGFloat = 38

    var body: some View {
        VStack(spacing: 12) {
            // Custom Text View
            CustomTextView(text: $messageInputVM.messageText, dynamicHeight: $dynamicHeight) {
                messageInputVM.sendMessage()
            }
            .frame(height: dynamicHeight)
            .background(Color(NSColor.controlBackgroundColor))
            .cornerRadius(6)
            .overlay(
                RoundedRectangle(cornerRadius: 6)
                    .stroke(Color.gray.opacity(0.3), lineWidth: 1)
            )
            
            // 底部控制栏
            HStack(spacing: 12) {
                // 左边模型选择器
                Menu {
                    ForEach(messageInputVM.supportedModels, id: \.name) { model in
                        Button(action: {
                            Task {
                                await messageInputVM.switchModel(to: model.name)
                            }
                        }) {
                            HStack {
                                Text(model.displayName)
                                Spacer()
                                if model.name == messageInputVM.currentModel?.name {
                                    Image(systemName: "checkmark")
                                        .foregroundColor(.blue)
                                }
                                // 可用性状态
                                Circle()
                                    .fill(model.isAvailable ? .green : .red)
                                    .frame(width: 8, height: 8)
                            }
                        }
                        .disabled(messageInputVM.isLoadingModels)
                    }
                } label: {
                    HStack(spacing: 8) {
                        if messageInputVM.isLoadingModels {
                            ProgressView()
                                .scaleEffect(0.8)
                        } else {
                            // 模型可用性指示器
                            Circle()
                                .fill(messageInputVM.currentModel?.isAvailable == true ? .green : .red)
                                .frame(width: 8, height: 8)
                        }
                        
                        Text(messageInputVM.currentModel?.displayName ?? "选择模型")
                            .foregroundColor(.primary)
                        
                        Image(systemName: "chevron.up.chevron.down")
                            .foregroundColor(.secondary)
                            .font(.caption2)
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color(NSColor.controlBackgroundColor))
                    .overlay(
                        RoundedRectangle(cornerRadius: 6)
                            .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                    )
                    .cornerRadius(6)
                }
                .menuStyle(.borderlessButton)
                .disabled(messageInputVM.isLoadingModels)
                
                Spacer()
                
                // Token使用情况显示
                TokenUsageView()
                
                // 右边发送/取消按钮
                if chatService.isLoading {
                    Button(action: {
                        Task {
                            await chatService.cancelChat()
                        }
                    }) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title2)
                            .foregroundColor(.red)
                    }
                    .buttonStyle(.plain)
                } else {
                    Button(action: {
                        messageInputVM.sendMessage()
                    }) {
                        Image(systemName: "arrow.up.circle.fill")
                            .font(.title2)
                            .foregroundColor(messageInputVM.messageText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? .secondary : .blue)
                    }
                    .disabled(messageInputVM.messageText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color(NSColor.controlBackgroundColor))
        .onAppear {
            Task {
                await messageInputVM.fetchModelStatus()
            }
        }
    }
}

#Preview {
    MessageInputView()
} 
