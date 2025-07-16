//
//  AuthCodeVM.swift
//  GeminiForMac
//
//  Created by AI Assistant on 2025/7/16.
//

import Foundation
import SwiftUI
import Factory

struct AuthCodeInputModel {
    var code: String = ""
}

@MainActor
class AuthCodeVM: ObservableObject {
    @Injected(\.authService) private var authService
    
    @Published var inputModel = AuthCodeInputModel()
    @Published var isSubmitting = false
    @Published var errorMessage: String?
    
    func submit() async {
        guard !inputModel.code.trimmingCharacters(in: CharacterSet.whitespacesAndNewlines).isEmpty else {
            errorMessage = "请输入授权码"
            return
        }
        
        isSubmitting = true
        errorMessage = nil
        
        let success = await authService.submitAuthCode(code: inputModel.code)
        
        isSubmitting = false
        
        if success {
            // 授权成功，关闭授权码输入界面
            authService.closeAuthCodeInput()
        } else {
            errorMessage = "授权码验证失败，请检查授权码是否正确"
        }
    }
    
    func cancel() {
        authService.closeAuthCodeInput()
    }
} 