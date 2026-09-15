const fs = require('fs');
let code = fs.readFileSync('mobile/App.tsx', 'utf8');

// 1. Add states to AdminHome
const adminHomeStart = `function AdminHome({ onLogout }: { onLogout: () => void }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AdminAttendance[]>([]);`;

const newAdminHomeStart = `function AdminHome({ onLogout }: { onLogout: () => void }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AdminAttendance[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');`;

code = code.replace(adminHomeStart, newAdminHomeStart);

// 2. Add derived values and UI before listCard
const oldListCard = `<View style={styles.listCard}>{employees.map((item) => <Pressable key={item.id} style={styles.employeeRow} onPress={() => setSelectedEmployee(item)}><View style={styles.avatarSmall}><Text style={styles.avatarSmallText}>{item.full_name.slice(0, 1).toUpperCase()}</Text></View><View style={styles.employeeInfo}><Text style={styles.employeeName}>{item.full_name}</Text><Text style={styles.mutedText}>{item.designation || 'Employee'}</Text></View><Text style={styles.rowChevron}>›</Text></Pressable>)}</View>`;

const newListCard = `
          <View style={styles.filterContainer}>
            <TextInput style={styles.searchInput} placeholder="Search employee..." value={searchQuery} onChangeText={setSearchQuery} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deptScroll} contentContainerStyle={{gap: 8}}>
              <Pressable style={[styles.deptChip, departmentFilter === '' && styles.deptChipActive]} onPress={() => setDepartmentFilter('')}>
                <Text style={[styles.deptChipText, departmentFilter === '' && styles.deptChipTextActive]}>All</Text>
              </Pressable>
              {Array.from(new Set(employees.map(e => e.department).filter(Boolean))).sort().map(dept => (
                <Pressable key={dept as string} style={[styles.deptChip, departmentFilter === dept && styles.deptChipActive]} onPress={() => setDepartmentFilter(dept as string)}>
                  <Text style={[styles.deptChipText, departmentFilter === dept && styles.deptChipTextActive]}>{dept as string}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          <View style={styles.listCard}>
            {employees.filter(item => {
              const matchesSearch = item.full_name.toLowerCase().includes(searchQuery.toLowerCase());
              const matchesDept = departmentFilter ? item.department === departmentFilter : true;
              return matchesSearch && matchesDept;
            }).map((item) => (
              <Pressable key={item.id} style={styles.employeeRow} onPress={() => setSelectedEmployee(item)}>
                <View style={styles.avatarSmall}><Text style={styles.avatarSmallText}>{item.full_name.slice(0, 1).toUpperCase()}</Text></View>
                <View style={styles.employeeInfo}><Text style={styles.employeeName}>{item.full_name}</Text><Text style={styles.mutedText}>{item.designation || 'Employee'}</Text></View>
                <Text style={styles.rowChevron}>›</Text>
              </Pressable>
            ))}
          </View>
`;
code = code.replace(oldListCard, newListCard);

// Update section meta to show filtered count
const oldSectionMeta = `<Text style={styles.sectionMeta}>{employees.length} total</Text>`;
const newSectionMeta = `<Text style={styles.sectionMeta}>{employees.filter(item => (departmentFilter ? item.department === departmentFilter : true) && item.full_name.toLowerCase().includes(searchQuery.toLowerCase())).length} total</Text>`;
code = code.replace(oldSectionMeta, newSectionMeta);

// Add styles
const oldStyles = `employeeRow: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#EFF2F6', flexDirection: 'row', alignItems: 'center' },`;
const newStyles = `
    filterContainer: { marginTop: 12, marginBottom: 8 },
    searchInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 16, height: 44, fontSize: 15, marginBottom: 10, color: colors.ink },
    deptScroll: { paddingBottom: 4 },
    deptChip: { backgroundColor: '#F0F4F8', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
    deptChipActive: { backgroundColor: '#E0E7FF', borderColor: colors.blue },
    deptChipText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
    deptChipTextActive: { color: colors.blue },
    employeeRow: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#EFF2F6', flexDirection: 'row', alignItems: 'center' },
`;
code = code.replace(oldStyles, newStyles);

fs.writeFileSync('mobile/App.tsx', code);
console.log('mobile/App.tsx updated');
