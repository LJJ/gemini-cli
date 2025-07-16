
import SwiftUI
import AppKit

@MainActor
struct CustomTextView: NSViewRepresentable {
    @Binding var text: String
    @Binding var dynamicHeight: CGFloat
    
    var onCommit: () -> Void
    
    private let minHeight: CGFloat = 38 // Adjusted for padding
    private let maxHeight: CGFloat = 100

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeNSView(context: Context) -> NSScrollView {
        let textView = NSTextView()
        textView.delegate = context.coordinator
        
        textView.font = NSFont.systemFont(ofSize: 14)
        textView.isRichText = false
        textView.isEditable = true
        textView.isSelectable = true
        textView.allowsUndo = true
        
        textView.isVerticallyResizable = true
        textView.isHorizontallyResizable = false
        textView.textContainer?.widthTracksTextView = true
        
        // Add internal padding
        textView.textContainerInset = NSSize(width: 8, height: 8)
        
        // 确保背景和文字颜色设置正确
        textView.textColor = .textColor
        
        // 强制刷新显示
        textView.needsDisplay = true
        
        // 确保文字容器设置正确
        textView.textContainer?.lineFragmentPadding = 0
        
        let scrollView = NSScrollView()
        scrollView.documentView = textView
        scrollView.hasVerticalScroller = false
        
        // 确保 textView 有正确的宽度和布局
        textView.maxSize = NSSize(width: CGFloat.greatestFiniteMagnitude, height: CGFloat.greatestFiniteMagnitude)
        textView.textContainer?.containerSize = NSSize(width: CGFloat.greatestFiniteMagnitude, height: CGFloat.greatestFiniteMagnitude)

        // 设置文本内容，并确保颜色设置生效
        textView.string = text
        
        context.coordinator.recalculateHeight(for: textView)
        
        // Set focus when the view appears
        DispatchQueue.main.async {
            textView.window?.makeFirstResponder(textView)
        }
        
        return scrollView
    }

    func updateNSView(_ nsView: NSScrollView, context: Context) {
        guard let textView = nsView.documentView as? NSTextView else { return }
        
        // 确保 textView 有正确的宽度
        let scrollViewWidth = nsView.bounds.width
        if textView.frame.width != scrollViewWidth {
            textView.frame.size.width = scrollViewWidth
            textView.textContainer?.size.width = scrollViewWidth
        }
        
        if textView.string != text {
            textView.string = text
        }
    }

    @MainActor
    class Coordinator: NSObject, NSTextViewDelegate {
        var parent: CustomTextView

        init(_ parent: CustomTextView) {
            self.parent = parent
        }

        func textDidChange(_ notification: Notification) {
            guard let textView = notification.object as? NSTextView else { return }
            parent.text = textView.string
            // 确保文本颜色在输入时保持正确
            textView.textColor = NSColor.black
            recalculateHeight(for: textView)
        }
        
        func recalculateHeight(for textView: NSTextView) {
            guard let layoutManager = textView.layoutManager, let textContainer = textView.textContainer else { return }
            let usedRect = layoutManager.usedRect(for: textContainer)
            
            // Add vertical insets to the calculated height
            let contentHeight = usedRect.height + textView.textContainerInset.height * 2
            let newHeight = min(parent.maxHeight, max(parent.minHeight, contentHeight))
            
            if abs(parent.dynamicHeight - newHeight) > 1 {
                DispatchQueue.main.async {
                    self.parent.dynamicHeight = newHeight
                }
            }
            
            if let scrollView = textView.enclosingScrollView {
                let contentExceedsMax = usedRect.height > (parent.maxHeight - textView.textContainerInset.height * 2)
                if scrollView.hasVerticalScroller != contentExceedsMax {
                    scrollView.hasVerticalScroller = contentExceedsMax
                }
            }
        }

        func textView(_ textView: NSTextView, doCommandBy commandSelector: Selector) -> Bool {
            if commandSelector == #selector(NSResponder.insertNewline(_:)) {
                if let event = NSApp.currentEvent, event.modifierFlags.contains(.shift) {
                    // Shift+Enter: allow default behavior
                    return false
                } else {
                    // Enter: commit and prevent newline
                    parent.onCommit()
                    return true
                }
            }
            // Allow default behavior for all other commands
            return false
        }
    }
}
