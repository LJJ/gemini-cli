//
//  ProjectConfigurationView.swift
//  GeminiForMac
//
//  Created by LJJ on 2025/7/16.
//

import SwiftUI

struct ProjectConfigurationView: View {
    @StateObject private var viewModel = ProjectConfigurationVM()
    @Binding var isPresented: Bool
    let errorMessage: String
    
    @State private var projectId: String = ""
    @State private var isApplying: Bool = false
    @State private var showInstructions: Bool = false
    
    var body: some View {
        VStack(spacing: 20) {
            // 标题
            HStack {
                Image(systemName: "gear.circle.fill")
                    .foregroundColor(.orange)
                    .font(.title2)
                
                Text("项目配置设置")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Spacer()
                
                Button(action: {
                    isPresented = false
                }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.gray)
                        .font(.title2)
                }
                .buttonStyle(.plain)
            }
            
            Divider()
            
            // 错误消息显示
            VStack(alignment: .leading, spacing: 12) {
                Text("配置问题")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.secondary)
                
                Text(errorMessage)
                    .lineLimit(nil)
                    .multilineTextAlignment(.leading)
                    .font(.body)
                    .foregroundColor(.primary)
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color(NSColor.controlBackgroundColor))
                    .cornerRadius(8)
            }
            
            // 项目ID输入
            VStack(alignment: .leading, spacing: 8) {
                Text("设置 Google Cloud Project ID")
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                TextField("输入你的 Google Cloud Project ID", text: $viewModel.projectId)
                    .textFieldStyle(.roundedBorder)
                    .font(.system(.body, design: .monospaced))
                
                Text("项目ID可以在 Google Cloud Console 中找到")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            // 说明和链接
            VStack(alignment: .leading, spacing: 8) {
                Button(action: {
                    viewModel.showInstructions.toggle()
                }) {
                    HStack {
                        Image(systemName: viewModel.showInstructions ? "chevron.down" : "chevron.right")
                            .font(.caption)
                        Text("查看详细设置说明")
                            .font(.subheadline)
                        Spacer()
                    }
                    .foregroundColor(.blue)
                }
                .buttonStyle(.plain)
                
                if viewModel.showInstructions {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("设置步骤：")
                            .font(.caption)
                            .fontWeight(.medium)
                        
                        Text("1. 打开系统设置 → 环境变量")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Text("2. 添加环境变量：GOOGLE_CLOUD_PROJECT")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Text("3. 重启应用程序")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        // 帮助链接
                        if let helpURL = viewModel.extractHelpURL(from: errorMessage) {
                            Button(action: {
                                if let url = URL(string: helpURL) {
                                    NSWorkspace.shared.open(url)
                                }
                            }) {
                                HStack {
                                    Image(systemName: "link")
                                        .font(.caption)
                                    Text("查看完整文档")
                                        .font(.caption)
                                }
                                .foregroundColor(.blue)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.leading, 16)
                }
            }
            
            Divider()
            
            // 按钮
            HStack {
                Button(action: {
                    viewModel.openSystemPreferences()
                }) {
                    HStack {
                        Image(systemName: "gear")
                        Text("打开系统设置")
                    }
                }
                .buttonStyle(.bordered)
                
                Spacer()
                
                Button("取消") {
                    isPresented = false
                }
                .buttonStyle(.bordered)
                
                Button("应用设置") {
                    Task {
                        let success = await viewModel.applyProjectConfiguration()
                        if success {
                            isPresented = false
                        }
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(viewModel.projectId.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || viewModel.isApplying)
            }
            
            // 应用状态
            if viewModel.isApplying {
                HStack {
                    ProgressView()
                        .scaleEffect(0.8)
                    Text("正在应用设置...")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(20)
        .frame(width: 500, height: viewModel.showInstructions ? 450 : 350)
        .background(Color(NSColor.windowBackgroundColor))
        .onAppear {
            Task {
                await viewModel.loadConfig()
            }
        }
        .alert(viewModel.alertTitle, isPresented: $viewModel.showAlert) {
            Button("确定", role: .cancel) { }
        } message: {
            Text(viewModel.alertMessage)
        }
    }
}

// 预览
struct ProjectConfigurationView_Previews: PreviewProvider {
    static var previews: some View {
        ProjectConfigurationView(
            isPresented: .constant(true),
            errorMessage: "This account requires setting the GOOGLE_CLOUD_PROJECT env var. See https://goo.gle/gemini-cli-auth-docs#workspace-gca"
        )
    }
}
