#!/usr/bin/env python3

with open('src/components/ui/DataTable.tsx', 'r') as f:
    content = f.read()

# Find the exact start
start_marker = 'columns.filter(c => c.filterable).map(col => ('
start_idx = content.index(start_marker)
print(f"Found start at index {start_idx}")

# The opening brace is on the previous line
# Find the { that starts the JSX expression
search_start = content.rfind('{', 0, start_idx)
print(f"Found opening {{ at index {search_start}")

# Find the matching closing
# We need to find the }) that closes the map callback
# The pattern is: ... ) )}
# Actually it's: ... ) )}
# Let's search from the map start
map_start = content.index('columns.filter(c => c.filterable).map(col => (')
brace_count = 0
paren_count = 0
i = map_start
while i < len(content):
    c = content[i]
    if c == '(':
        paren_count += 1
    elif c == ')':
        paren_count -= 1
        if paren_count == 0 and content[i:i+2] == ')}':
            end_idx = i + 2
            print(f"Found end at index {end_idx}")
            break
    i += 1
else:
    print("Could not find end")
    exit(1)

# Extract old code
old_code = content[map_start:end_idx]
print(f"Old code length: {len(old_code)}")

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
new_content = content[:map_start] + new_code + content[map_start + len(content[map_start:content.index(')}', map_start)+2]):]

# Actually let's do it more carefully
# Find the exact end position
end_marker = ')}'
end_pos = content.index(')}', map_start)
# Find the correct one
for m in re.finditer(r'\)\}', content[map_start:]):
    pos = map_start + m.start()
    # Check if this is the right one by checking context
    if content[pos-50:pos].count('map(col =>') > 0:
        end_pos = pos + 2
        break

print(f"Map start: {map_start}, End: {end_pos}")

old_code = content[map_start:end_pos]
print(f"Old code length: {len(old_code)}")

new_content = content[:map_start] + new_code + content[end_pos:]

with open('src/components/ui/DataTable.tsx', 'w') as f:
    f.write(new_content)

print("Fixed!")