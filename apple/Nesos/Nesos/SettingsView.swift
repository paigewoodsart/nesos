import SwiftUI

struct SettingsView: View {
    var showsDone = true

    @Environment(AuthStore.self) private var auth
    @Environment(PlannerStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @State private var confirmingDelete = false
    @State private var deleting = false

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    LabeledContent("Signed in as", value: auth.email ?? "")
                }
                Section {
                    Link("Privacy policy", destination: Config.privacyURL)
                }
                Section {
                    Button("Sign out") {
                        WebSession.clear()
                        auth.signOut()
                        dismiss()
                    }
                    Button("Delete account", role: .destructive) {
                        confirmingDelete = true
                    }
                    .disabled(deleting)
                } footer: {
                    Text("Deleting your account permanently removes your tasks, notes, goals and projects.")
                }
                if let error = store.errorMessage {
                    Text(error).font(.footnote).foregroundStyle(.red)
                }
            }
            .formStyle(.grouped)
            .navigationTitle("Account")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                if showsDone {
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Done") { dismiss() }
                    }
                }
            }
            .confirmationDialog(
                "Delete your Nesos account?",
                isPresented: $confirmingDelete,
                titleVisibility: .visible
            ) {
                Button("Delete account", role: .destructive) {
                    deleting = true
                    Task {
                        if await store.deleteAccount() {
                            WebSession.clear()
                            dismiss()
                        }
                        deleting = false
                    }
                }
            } message: {
                Text("This can't be undone.")
            }
        }
        #if os(macOS)
        .frame(minWidth: 420, minHeight: 300)
        #endif
    }
}
