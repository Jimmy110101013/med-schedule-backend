use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create courses and exam_rules tables",
            sql: include_str!("../migrations/001_init.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create kokushi (board exam) tables and seed subjects/subtopics",
            sql: include_str!("../migrations/002_kokushi.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "add 一刷/二刷/考古 checklist columns and default exam date",
            sql: include_str!("../migrations/003_kokushi_checklist.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "create kokushi_activity table for daily study heatmap",
            sql: include_str!("../migrations/004_kokushi_activity.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "add subtopic check dedup log; reset inflated activity counts",
            sql: include_str!("../migrations/005_kokushi_check_log.sql"),
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:med_tracker.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
