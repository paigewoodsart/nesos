import WebKit

/// Clears the planner window's saved sign-in (cookies and site data) on sign out.
enum WebSession {
    static func clear() {
        let store = WKWebsiteDataStore.default()
        let types = WKWebsiteDataStore.allWebsiteDataTypes()
        store.fetchDataRecords(ofTypes: types) { records in
            let nesos = records.filter { $0.displayName.contains("nesos") }
            store.removeData(ofTypes: types, for: nesos) {}
        }
    }
}
