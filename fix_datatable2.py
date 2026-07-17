#!/usr/bin/env python3

with open('src/components/ui/DataTable.tsx', 'r') as f:
    content = f.read()

# Find the problematic map callback
old_pattern = '''            {columns.filter(c => c.filterable).map(col => (
              <div key={col.key} className="relative min-w-[140px] flex-1">
                {col.filterOptions ? (
                  <select
                    value={filters[col.key] || ""}
                    onChange={e => handleFilter(col.key, e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-accent"
                  >
                    <option value="">{t("all")}</option>
                    {col.filterOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={filters[col.key] || ""}
                    onChange={e => handleFilter(col.key, e.target.value)}
                    placeholder={t("filterBy", { column: col.header })}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-accent"
                  />
                )}
              </div>
            ))}
        </div>'''

new_pattern = '''            {columns.filter(c => c.filterable).map(col => {
              return (
                <div key={col.key} className="relative min-w-[140px] flex-1">
                  {col.filterOptions ? (
                    <select
                      value={filters[col.key] || ""}
                      onChange={e => handleFilter(col.key, e.target.value)}
                      className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-accent"
                    >
                      <option value="">{t("all")}</option>
                      {col.filterOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={filters[col.key] || ""}
                      onChange={e => handleFilter(col.key, e.target.value)}
                      placeholder={t("filterBy", { column: col.header })}
                      className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-accent"
                    />
                  )}
              </div>
              );
            })}
        </div>'''

if old_pattern in content:
    content = content.replace(old_pattern, new_pattern)
    with open('src/components/ui/DataTable.tsx', 'w') as f:
        f.write(content)
    print("Fixed!")
else:
    print("Pattern not found!")
    # Debug: find what's actually there
    import re
    matches = re.findall(r'columns\.filter\(c => c\.filterable\)\.map\(col => \(', content)
    print(f"Found {len(matches)} occurrences of map callback start")
    if matches:
        idx = content.index('columns.filter(c => c.filterable).map(col => (')
        print("Context around match:")
        print(content[idx:idx+500])