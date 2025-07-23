//
//  CustomGitHubTheme.swift
//  GeminiForMac
//
//  Created by LJJ on 2025/7/23.
//

import SwiftUI
@preconcurrency import MarkdownUI

extension Theme {
    static let myGitHub = Theme.gitHub.text {
        BackgroundColor(nil)
    }.code {
        BackgroundColor(nil)
    }
}
