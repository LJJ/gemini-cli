//
//  AuthDialogView.swift
//  GeminiForMac
//
//  Created by LJJ on 2025/7/9.
//

import SwiftUI
import Factory

struct AuthDialogView: View {
    @StateObject private var authVM = AuthDialogVM()
    @StateObject private var authService = Container.shared.authService.resolve()
    
    var body: some View {
        VStack(spacing: 16) {
            // 标题
            HStack {
                Image(systemName: "person.circle.fill")
                    .foregroundColor(.blue)
                    .font(.title)
                Text("选择认证方式")
                    .font(.title2)
                    .fontWeight(.semibold)
                Spacer()
            }
            
            // 认证方式选择
            VStack(alignment: .leading, spacing: 12) {
                Text("认证方式")
                    .font(.headline)
                    .foregroundColor(.primary)
                
                ForEach(AuthType.allCases, id: \.self) { authType in
                    AuthTypeRow(
                        authType: authType,
                        isSelected: authVM.selectedAuthType == authType,
                        onSelect: {
                            authVM.selectAuthType(authType)
                        }
                    )
                }
            }
            
            // 认证配置表单
            if authVM.selectedAuthType == .useGemini {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Gemini API Key")
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    SecureField("输入你的 Gemini API Key", text: $authVM.apiKey)
                        .textFieldStyle(.roundedBorder)
                    
                    Text("从 [AI Studio](https://aistudio.google.com/) 获取 API Key")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            } else if authVM.selectedAuthType == .useVertexAI {
                VStack(alignment: .leading, spacing: 12) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Google API Key")
                            .font(.subheadline)
                            .fontWeight(.medium)
                        
                        SecureField("输入你的 Google API Key", text: $authVM.apiKey)
                            .textFieldStyle(.roundedBorder)
                    }
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Google Cloud Project ID")
                            .font(.subheadline)
                            .fontWeight(.medium)
                        
                        TextField("输入你的 Google Cloud Project ID", text: $authVM.googleCloudProject)
                            .textFieldStyle(.roundedBorder)
                    }
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Google Cloud Location")
                            .font(.subheadline)
                            .fontWeight(.medium)
                        
                        TextField("例如: us-central1", text: $authVM.googleCloudLocation)
                            .textFieldStyle(.roundedBorder)
                    }
                }
            }
            
            // 错误信息
            if let error = authVM.validationError {
                HStack {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.red)
                    Text(error)
                        .foregroundColor(.red)
                        .font(.caption)
                    Spacer()
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color.red.opacity(0.1))
                .cornerRadius(8)
            }
            
            // 认证状态
            if authVM.isAuthenticating {
                HStack {
                    ProgressView()
                        .scaleEffect(0.8)
                    Text("正在认证...")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Spacer()
                }
            }
            
            // 按钮
            HStack(spacing: 12) {
                Button("取消") {
                    authVM.closeAuthDialog()
                }
                .buttonStyle(.bordered)
                
                Spacer()
                
                Button("确认") {
                    Task {
                        await authVM.authenticate()
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(!authVM.canAuthenticate)
            }
        }
        .padding(20)
        .frame(minWidth: 450, idealWidth: 500, minHeight: 400)
        .background(Color(NSColor.controlBackgroundColor))
        .cornerRadius(12)
        .shadow(radius: 10)
        .sheet(isPresented: $authService.showAuthCodeInput) {
            AuthCodeView()
                .frame(width: 500, height: 400)
        }
    }
}

struct AuthTypeRow: View {
    let authType: AuthType
    let isSelected: Bool
    let onSelect: () -> Void
    
    var body: some View {
        Button(action: onSelect) {
            HStack {
                // 选择指示器
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(isSelected ? .blue : .secondary)
                    .font(.title3)
                
                // 认证方式信息
                VStack(alignment: .leading, spacing: 4) {
                    Text(authType.displayName)
                        .font(.body)
                        .fontWeight(.medium)
                        .foregroundColor(.primary)
                    
                    Text(authType.description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.leading)
                }
                
                Spacer()
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(isSelected ? Color.blue.opacity(0.1) : Color.clear)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(isSelected ? Color.blue : Color.clear, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    AuthDialogView()
        .padding()
} 
