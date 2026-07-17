#!/usr/bin/env python3

with open('src/components/ui/DataTable.tsx', 'r') as f:
    content = f.read()

# Find the exact content between the map callback start and end
import re

# Find start
start_marker = 'columns.filter(c => c.filterable).map(col => ('
start_idx = content.index(start_marker)
print(f"Found start at index {start_idx}")

# Find the matching closing by counting parens
search_start = content.index('{columns.filter(c => c.filterable).map(col => (', start_idx)
print(f"Found {{ at index {search_start}")

# From the { after the map, find the matching closing
paren_count = 0
brace_count = 0
i = search_start
while i < len(content):
    c = content[i]
    if c == '{':
        brace_count += 1
    elif c == '}':
        brace_count -= 1
    elif c == '(':
        paren_count += 1
    elif c == ')':
        paren_count -= 1
    
    # We're looking for the closing of the outer {columns.filter...} block
    # which is a ')' followed by ')}' pattern
    if i > search_start and content[i:i+2] == ')}' and paren_count == 0 and brace_count == 0:
        end_idx = i + 2
        print(f"Found end at index {end_idx}")
        break
    i += 1
else:
    print("Could not find end")
    exit(1)

# Extract the old code
old_code = content[search_start:end_idx]
print(f"Old code length: {len(old_code)}")
print("Old code preview:")
print(old_code[:200])
print("...")
print(old_code[-200:])

# Build new code
new_code = '''{columns.filter(c => c.filterable).map(col => {
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
            })}'''

# Replace
new_content = content[:search_start] + new_code + content[end_idx:]

with open('src/components/ui/DataTable.tsx', 'w') as f:
    f.write(new_content)

print("Fixed!")