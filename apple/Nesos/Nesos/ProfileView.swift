#if os(iOS)
import SwiftUI
import UIKit

/// Account, theme and the small print.
struct ProfileView: View {
    @Binding var path: [Route]

    @Environment(AppStore.self) private var store
    @Environment(AuthStore.self) private var auth
    @State private var picking: PickerTarget?

    private enum PickerTarget: String, Identifiable {
        case theme, personal
        var id: String { rawValue }
    }
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
            HeaderBar(onBack: { path.removeLast() }, onAccount: nil, showsName: true)

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
            .foregroundStyle(store.palette.onBase)
            .frame(height: 96)
            .background(store.palette.base)
            .clipShape(RoundedRectangle(cornerRadius: 7))

            Text("YOUR COLOR").caps(11, spacing: 0.24).foregroundStyle(Theme.inkSoft)

            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 8) {
                    ForEach(Palette.presets, id: \.self) { hex in
                        Button { store.setPersonalColor(hex) } label: {
                            RoundedRectangle(cornerRadius: 7)
                                .fill(Color(hex: hex))
                                .frame(maxWidth: .infinity)
                                .frame(height: 36)
                                .overlay { if isPersonal(hex) { selectionRing } }
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Color \(hex)")
                    }
                    Button { picking = .personal } label: {
                        Icon(.plus, size: 14)
                            .foregroundStyle(hasCustomPersonal ? store.palette.onBase : Theme.accent)
                            .frame(maxWidth: .infinity)
                            .frame(height: 36)
                            .background(hasCustomPersonal ? store.palette.base : Theme.card, in: RoundedRectangle(cornerRadius: 7))
                            .overlay(RoundedRectangle(cornerRadius: 7).stroke(Theme.cardBorder, lineWidth: 1))
                            .overlay { if hasCustomPersonal { selectionRing } }
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Custom color")
                }
                Text("Colors this tile, your Overdue, Today and This Week tiles, and the date on home.")
                    .font(NFont.inter(11))
                    .foregroundStyle(Theme.inkLight)
                    .fixedSize(horizontal: false, vertical: true)
            }

            Text("THEME").caps(11, spacing: 0.24).foregroundStyle(Theme.inkSoft)

            HStack(spacing: 10) {
                themeButton("PASTEL", selected: store.theme == "original", label: Theme.fixedInkSoft) {
                    BoardBackground.pastel
                } action: { store.setTheme("original") }

                themeButton("NEUTRAL", selected: store.theme == "neutral", label: Theme.fixedInkSoft) {
                    LinearGradient(colors: [Color(hex: "#FAF7F2"), Color(hex: "#F5EDE0"), Color(hex: "#EDE3D4")], startPoint: .top, endPoint: .bottom)
                } action: { store.setTheme("neutral") }

                themeButton(
                    store.theme == "custom" ? "CUSTOM · EDIT" : "CUSTOM",
                    selected: store.theme == "custom",
                    label: RGB(hex: store.customColor).luminance < AppStore.darkBoardBelow ? .white : Theme.fixedInkSoft
                ) {
                    Color(hex: store.customColor)
                } action: {
                    if store.theme == "custom" {
                        picking = .theme
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
        .sheet(item: $picking) { target in
            ColorPickerSheet(hex: target == .theme ? store.customColor : store.personalColor) { hex in
                if target == .theme {
                    store.setCustomColor(hex)
                } else {
                    store.setPersonalColor(hex)
                }
            }
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

    private func isPersonal(_ hex: String) -> Bool { hex.lowercased() == store.personalColor.lowercased() }

    private var hasCustomPersonal: Bool { !Palette.presets.contains { isPersonal($0) } }

    private var selectionRing: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 8).stroke(Color.white, lineWidth: 2).padding(-1)
            RoundedRectangle(cornerRadius: 10).stroke(Theme.ink, lineWidth: 2).padding(-3)
        }
    }

    private func themeButton<Swatch: View>(
        _ title: String,
        selected: Bool,
        label: Color,
        @ViewBuilder swatch: () -> Swatch,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            swatch()
                .frame(maxWidth: .infinity)
                .frame(height: 64)
                .overlay(alignment: .bottom) {
                    Text(title).caps(9).foregroundStyle(label).lineLimit(1).minimumScaleFactor(0.8)
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
