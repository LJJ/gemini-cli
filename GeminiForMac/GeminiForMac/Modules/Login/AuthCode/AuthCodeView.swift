//
//  AuthCodeView.swift
//  GeminiForMac
//
//  Created by AI Assistant on 2025/7/16.
//

import SwiftUI

struct AuthCodeView: View {
    @StateObject private var vm = AuthCodeVM()
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Google 授权码输入")
                .font(.title2)
                .fontWeight(.semibold)

            Text("请在浏览器中完成授权，然后将获得的授权码粘贴到下方：")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            TextField("请输入授权码", text: $vm.inputModel.code)
                .textFieldStyle(.roundedBorder)
                .frame(maxWidth: 300)
                .disabled(vm.isSubmitting)

            if let error = vm.errorMessage {
                Text(error)
                    .foregroundColor(.red)
                    .font(.caption)
            }

            HStack(spacing: 16) {
                Button("取消") {
                    vm.cancel()
                }
                .buttonStyle(.bordered)
                .disabled(vm.isSubmitting)

                Button("提交") {
                    Task { await vm.submit() }
                }
                .buttonStyle(.borderedProminent)
                .disabled(vm.isSubmitting)
            }
        }
        .padding(30)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
} 
