#if os(iOS)
import SwiftUI
import UIKit

/// Account, theme and the small print.
struct ProfileView: View {
    @Binding var path: [Route]

    @Environment(AppStore.self) private var store
    @Environment(AuthStore.self) private var auth
    @State private var showColorPicker = false
    @State private var confirmDelete = false
    @State private var deleting = false

    init(path: Binding<[Route]>) {
        _path = path
    }

    private var displayName: String {
        if auth.isGuest { return "Guest" }
        if let name = auth.name?.split(separator: " ").first { return String(name) }
        return auth.email?.split(separator: "@").first.map { String($0) } ?? "You"
    }

    var body: some View {
        Screen {
            HeaderBar(onBack: { path.removeLast() }, onAccount: nil)

            VStack(alignment: .leading, spacing: 0) {
                HStack(spacing: 12) {
                    Text(String(displayName.prefix(1)).uppercased())
                        .font(NFont.playfair(18))
                        .frame(width: 40, height: 40)
                        .background(Color.white.opacity(0.3), in: Circle())
                    Text(displayName).caps(16, spacing: 0.24).lineLimit(1).minimumScaleFactor(0.7)
                }
                .padding(EdgeInsets(top: 14, leading: 16, bottom: 0, trailing: 16))
                Spacer(minLength: 0)
                TileBar(height: 28, leading: 16, trailing: 16) {
                    if auth.isGuest {
                        Text("GUEST · SAVED ON THIS PHONE ONLY").caps(10, spacing: 0.22).lineLimit(1)
                    } else {
                        Text(auth.email ?? "SIGNED IN")
                            .font(NFont.inter(10, .semibold))
                            .tracking(1)
                            .lineLimit(1)
                    }
                    Spacer(minLength: 0)
                }
            }
            .foregroundStyle(.white)
            .frame(height: 96)
            .background(Theme.sky)
            .clipShape(RoundedRectangle(cornerRadius: 7))

            Text("THEME").caps(11, spacing: 0.24).foregroundStyle(Theme.inkSoft)

            HStack(spacing: 10) {
                themeButton("PASTEL", selected: store.theme == "original") {
                    BoardBackground.pastel
                } action: { store.setTheme("original") }

                themeButton("NEUTRAL", selected: store.theme == "neutral") {
                    LinearGradient(colors: [Color(hex: "#FAF7F2"), Color(hex: "#F5EDE0"), Color(hex: "#EDE3D4")], startPoint: .top, endPoint: .bottom)
                } action: { store.setTheme("neutral") }

                themeButton(store.theme == "custom" ? "CUSTOM · EDIT" : "CUSTOM", selected: store.theme == "custom") {
                    Color(hex: store.customColor)
                } action: {
                    if store.theme == "custom" {
                        showColorPicker = true
                    } else {
                        store.setTheme("custom")
                    }
                }
            }

            Text("MORE").caps(11, spacing: 0.24).foregroundStyle(Theme.inkSoft)

            VStack(spacing: 6) {
                linkRow("HOW NESOS WORKS", url: Config.baseURL)
                linkRow("PRIVACY POLICY", url: Config.privacyURL)
            }

            Spacer(minLength: 0)

            VStack(spacing: 12) {
                Button {
                    WebSession.clear()
                    store.reset()
                    auth.signOut()
                } label: {
                    Text(auth.isGuest ? "LEAVE GUEST MODE" : "SIGN OUT").caps(11, spacing: 0.24)
                        .foregroundStyle(Theme.accent)
                        .frame(maxWidth: .infinity)
                        .frame(height: 48)
                        .frosted()
                }
                .buttonStyle(.plain)

                if !auth.isGuest {
                    Button { confirmDelete = true } label: {
                        Text(deleting ? "DELETING…" : "DELETE ACCOUNT").caps(9, spacing: 0.24)
                            .foregroundStyle(Theme.danger)
                            .frame(height: 32)
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .disabled(deleting)
                }
            }
            .padding(.bottom, 18)
        }
        .sheet(isPresented: $showColorPicker) {
            ColorPickerSheet(hex: store.customColor) { store.setCustomColor($0) }
                .ignoresSafeArea()
        }
        .confirmationDialog(
            "Delete your Nesos account?",
            isPresented: $confirmDelete,
            titleVisibility: .visible
        ) {
            Button("Delete account and all data", role: .destructive) {
                Task {
                    deleting = true
                    if await store.deleteAccount() { WebSession.clear() }
                    deleting = false
                }
            }
        } message: {
            Text("This removes your projects, tasks, notes and files for good. It can't be undone.")
        }
    }

    private func themeButton<Swatch: View>(
        _ title: String,
        selected: Bool,
        @ViewBuilder swatch: () -> Swatch,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            swatch()
                .frame(maxWidth: .infinity)
                .frame(height: 64)
                .overlay(alignment: .bottom) {
                    Text(title).caps(9).foregroundStyle(Theme.inkSoft).lineLimit(1).minimumScaleFactor(0.8)
                        .padding(.bottom, 8)
                        .padding(.horizontal, 4)
                }
                .clipShape(RoundedRectangle(cornerRadius: 7))
                .overlay(
                    RoundedRectangle(cornerRadius: 7)
                        .strokeBorder(selected ? Theme.accent : Theme.cardBorder, lineWidth: selected ? 2 : 1)
                )
        }
        .buttonStyle(.plain)
        .accessibilityLabel("\(title) theme")
        .accessibilityAddTraits(selected ? .isSelected : [])
    }

    private func linkRow(_ title: String, url: URL) -> some View {
        Link(destination: url) {
            HStack {
                Text(title).caps(10, spacing: 0.22)
                Spacer()
                Icon(.forward, size: 14)
            }
            .foregroundStyle(Theme.ink)
            .padding(.horizontal, 14)
            .frame(height: 48)
            .card()
        }
    }
}

/// The system color picker, for the custom theme color.
private struct ColorPickerSheet: UIViewControllerRepresentable {
    let hex: String
    let onPick: (String) -> Void

    func makeCoordinator() -> Coordinator { Coordinator(onPick: onPick) }

    func makeUIViewController(context: Context) -> UIColorPickerViewController {
        let picker = UIColorPickerViewController()
        picker.supportsAlpha = false
        picker.selectedColor = UIColor(Color(hex: hex))
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ picker: UIColorPickerViewController, context: Context) {}

    final class Coordinator: NSObject, UIColorPickerViewControllerDelegate {
        let onPick: (String) -> Void

        init(onPick: @escaping (String) -> Void) {
            self.onPick = onPick
        }

        func colorPickerViewController(_ viewController: UIColorPickerViewController, didSelect color: UIColor, continuously: Bool) {
            guard !continuously else { return }
            onPick(Color(uiColor: color).hexString)
        }

        func colorPickerViewControllerDidFinish(_ viewController: UIColorPickerViewController) {
            onPick(Color(uiColor: viewController.selectedColor).hexString)
        }
    }
}
#endif
