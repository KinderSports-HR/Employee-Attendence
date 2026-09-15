import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useFonts as useDMSansFonts, DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import MapPreview from './MapPreview';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { createClient, type User } from '@supabase/supabase-js';

const supabase = createClient(
  'https://atebajfrbqmruqntoqik.supabase.co',
  'sb_publishable_aHPW2wHETJ8eQzQqodD4Jg_CatNVHN9',
);

type Employee = {
  id: string;
  full_name: string;
  phone: string | null;
  department: string | null;
  designation: string | null;
  role: string | null;
};

type Attendance = {
  id: string;
  date: string;
  time_in: string | null;
  status: string | null;
  location_address: string | null;
  latitude: number | null;
  longitude: number | null;
};

type AdminAttendance = Attendance & { employee_id: string };

const colors = {
  navy: '#101B33',
  blue: '#2F6FED',
  teal: '#159A82',
  ink: '#17233C',
  muted: '#6B7891',
  canvas: '#F5F7FB',
  line: '#E5EAF2',
  white: '#FFFFFF',
};

(Text as unknown as { defaultProps?: { style?: unknown } }).defaultProps = {
  style: { fontFamily: 'DMSans_400Regular' },
};

const cleanPhone = (value: string) => value.replace(/\D/g, '');

const csvValue = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

async function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const csv = [headers, ...rows].map((row) => row.map(csvValue).join(',')).join('\r\n');
  if (Platform.OS === 'web') {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    return;
  }
  const fileUri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export attendance report' });
}

async function getAddress(latitude: number, longitude: number) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, {
      headers: { Accept: 'application/json' },
    });
    if (response.ok) {
      const data = await response.json();
      return data.display_name || null;
    }
  } catch {
    // Coordinates remain available when address lookup is unavailable.
  }
  return null;
}

export default function App() {
  const [fontsLoaded] = useDMSansFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  const [phone, setPhone] = useState('');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  async function login() {
    const normalizedPhone = cleanPhone(phone);
    if (!normalizedPhone) {
      Alert.alert('Phone number required', 'Enter your registered phone number.');
      return;
    }
    setLoading(true);
    if (normalizedPhone === '8050984405') {
      setIsAdmin(true);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('phone', normalizedPhone)
      .maybeSingle();
    setLoading(false);
    if (error || !data) {
      Alert.alert('Login failed', `Phone number ${normalizedPhone} is not registered.`);
      return;
    }
    setEmployee(data as Employee);
  }

  function logout() {
    setEmployee(null);
    setIsAdmin(false);
    setPhone('');
  }

  if (!fontsLoaded) return <View style={styles.fontLoading}><ActivityIndicator color={colors.blue} /></View>;
  if (isAdmin) return <AdminHome onLogout={logout} />;
  if (employee) return <EmployeeHome employee={employee} onLogout={logout} />;
  return <Login phone={phone} setPhone={setPhone} loading={loading} onLogin={login} />;
}

function Login({ phone, setPhone, loading, onLogin }: { phone: string; setPhone: (value: string) => void; loading: boolean; onLogin: () => void }) {
  return (
    <SafeAreaView style={styles.loginScreen}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={styles.loginKeyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.loginContent} keyboardShouldPersistTaps="handled">
          <View style={styles.loginBrand}>
            <View style={styles.brandRow}>
              <View style={styles.brandMark}><Text style={styles.brandMarkText}>A</Text></View>
              <View><Text style={styles.brandKicker}>WORKFORCE HUB</Text><Text style={styles.brandTitle}>Attendance</Text></View>
            </View>
            <Text style={styles.brandSubtitle}>A calmer way to start the day.</Text>
          </View>
          <View style={styles.loginCard}>
            <View style={styles.cardAccent} />
            <Text style={styles.eyebrow}>WELCOME BACK</Text>
            <Text style={styles.loginTitle}>Sign in to your portal</Text>
            <Text style={styles.loginCopy}>Use the phone number registered with your organization.</Text>
            <Text style={styles.label}>Phone number</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="Enter phone number"
              placeholderTextColor="#9AA6B8"
              style={styles.input}
            />
            <Pressable style={styles.primaryButton} onPress={onLogin} disabled={loading}>
              {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryButtonText}>Continue</Text>}
            </Pressable>
            <Text style={styles.loginHint}>Your number is used only to identify your profile.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Header({ title, subtitle, onLogout }: { title: string; subtitle: string; onLogout: () => void }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerBrand}>
        <View style={styles.smallMark}><Text style={styles.smallMarkText}>A</Text></View>
        <View><Text style={styles.headerTitle}>{title}</Text><Text style={styles.headerSubtitle}>{subtitle}</Text></View>
      </View>
      <Pressable onPress={onLogout} style={styles.logoutButton}><Text style={styles.logoutText}>Log out</Text></Pressable>
    </View>
  );
}

function EmployeeHome({ employee, onLogout }: { employee: Employee; onLogout: () => void }) {
  const [history, setHistory] = useState<Attendance[]>([]);
  const [mapRegion, setMapRegion] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState('No location captured yet');
  const [marking, setMarking] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const todayRecord = history.find((record) => record.date === today);

  useEffect(() => {
    supabase.from('attendance').select('*').eq('employee_id', employee.id).order('date', { ascending: false }).then(async ({ data }) => {
      const records = (data || []) as Attendance[];
      const resolvedRecords = await Promise.all(records.map(async (record) => {
        if (!record.latitude || !record.longitude || (record.location_address && record.location_address !== 'Location captured')) return record;
        const address = await getAddress(record.latitude, record.longitude);
        if (!address) return record;
        await supabase.from('attendance').update({ location_address: address }).eq('id', record.id);
        return { ...record, location_address: address };
      }));
      setHistory(resolvedRecords);
      const latestLocation = resolvedRecords.find((record) => record.latitude && record.longitude);
      if (latestLocation) {
        setMapRegion({ latitude: latestLocation.latitude as number, longitude: latestLocation.longitude as number });
        let latestAddress = latestLocation.location_address;
        setLocationLabel(latestAddress || `${latestLocation.latitude}, ${latestLocation.longitude}`);
      }
    });
  }, [employee.id]);

  async function markAttendance() {
    setMarking(true);
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Location needed', 'Allow location access to mark attendance.');
      setMarking(false);
      return;
    }
    const position = await Location.getCurrentPositionAsync({});
    const coordinates = { latitude: position.coords.latitude, longitude: position.coords.longitude };
    const timeIn = new Date().toTimeString().slice(0, 8);
    const status = new Date().getHours() > 9 || (new Date().getHours() === 9 && new Date().getMinutes() > 30) ? 'Late' : 'Present';
    const address = await getAddress(coordinates.latitude, coordinates.longitude) || `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`;
    const { error } = await supabase.from('attendance').insert({ employee_id: employee.id, date: today, time_in: timeIn, status, latitude: coordinates.latitude, longitude: coordinates.longitude, location_address: address });
    setMarking(false);
    if (error) Alert.alert('Could not save attendance', error.message);
    else {
      setMapRegion(coordinates);
      setLocationLabel(address);
      setHistory((current) => [{ id: `local-${Date.now()}`, date: today, time_in: timeIn, status, location_address: address, latitude: coordinates.latitude, longitude: coordinates.longitude }, ...current]);
    }
  }

  return (
    <SafeAreaView style={styles.appScreen}>
      <StatusBar style="light" />
      <Header title="Employee portal" subtitle="Attendance at a glance" onLogout={onLogout} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageEyebrow}>MY WORKDAY</Text>
        <Text style={styles.pageTitle}>Good morning, {employee.full_name.split(' ')[0]}</Text>
        <Text style={styles.pageSubtitle}>{employee.department || 'General'}  |  {employee.designation || 'Employee'}</Text>
        <View style={styles.profileRow}><View style={styles.avatar}><Text style={styles.avatarText}>{employee.full_name.slice(0, 1).toUpperCase()}</Text></View><View><Text style={styles.profileName}>{employee.full_name}</Text><Text style={styles.mutedText}>{employee.phone || 'No phone number'}</Text></View></View>
        <View style={[styles.statusCard, todayRecord?.status === 'Present' ? styles.presentStatusCard : todayRecord?.status === 'Late' ? styles.lateStatusCard : todayRecord?.status === 'Absent' ? styles.absentStatusCard : styles.pendingStatusCard]}><View><Text style={styles.cardEyebrow}>TODAY'S STATUS</Text><Text style={styles.statusValue}>{todayRecord?.status || 'Not marked yet'}</Text></View><View style={[styles.statusDot, todayRecord?.status === 'Present' ? styles.presentStatusDot : todayRecord?.status === 'Late' ? styles.lateStatusDot : todayRecord?.status === 'Absent' ? styles.absentStatusDot : styles.pendingStatusDot]} /></View>
        {mapRegion && <View style={styles.mapCard}><View style={styles.mapHeader}><Text style={styles.cardEyebrow}>CHECK-IN LOCATION</Text><Text style={styles.locationPin}>GPS</Text></View><MapPreview latitude={mapRegion.latitude} longitude={mapRegion.longitude} label="Attendance check-in" /></View>}
        <Pressable style={[styles.attendanceButton, (todayRecord || marking) && styles.disabledButton]} onPress={markAttendance} disabled={!!todayRecord || marking}><Text style={styles.attendanceButtonText}>{marking ? 'Getting location...' : todayRecord ? 'Attendance marked' : 'Mark attendance'}</Text></Pressable>
        <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Attendance history</Text><Text style={styles.sectionMeta}>{history.length} records</Text></View>
        <View style={styles.listCard}>{history.length === 0 ? <Text style={styles.emptyText}>No attendance records yet.</Text> : history.slice(0, 12).map((record) => <Pressable key={record.id} style={styles.historyRow} onPress={() => { if (record.latitude && record.longitude) { setMapRegion({ latitude: record.latitude, longitude: record.longitude }); setLocationLabel(record.location_address || 'Saved attendance location'); } }}><View style={styles.historyInfo}><Text style={styles.historyDate}>{record.date}</Text><Text style={styles.mutedText}>{record.time_in || '--:--'}</Text><Text style={styles.locationText}>{record.location_address || 'Location unavailable'}</Text></View><Text style={[styles.badge, record.status === 'Late' ? styles.lateBadge : styles.presentBadge]}>{record.status || 'Unknown'}</Text></Pressable>)}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

function AdminHome({ onLogout }: { onLogout: () => void }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AdminAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const todayAttendance = attendance.filter((record) => record.date === today);
  const presentCount = todayAttendance.filter((record) => record.status === 'Present').length;
  const lateCount = todayAttendance.filter((record) => record.status === 'Late').length;
  const absentCount = Math.max(employees.length - presentCount - lateCount, 0);

  useEffect(() => {
    Promise.all([
      supabase.from('employees').select('*').order('full_name'),
      supabase.from('attendance').select('*').order('date', { ascending: false }),
    ]).then(([employeeResult, attendanceResult]) => {
      setEmployees((employeeResult.data || []) as Employee[]);
      setAttendance((attendanceResult.data || []) as AdminAttendance[]);
      setLoading(false);
    });
  }, []);

  async function exportDaily() {
    const employeeMap = new Map(employees.map((employee) => [employee.id, employee]));
    const rows = todayAttendance.map((record) => {
      const employee = employeeMap.get(record.employee_id);
      return [employee?.full_name || 'Unknown Employee', employee?.department || '', employee?.designation || '', record.date, record.time_in || '', record.status || '', record.location_address || ''];
    });
    await downloadCsv(`daily-attendance-${today}.csv`, ['Employee Name', 'Department', 'Designation', 'Date', 'Time In', 'Status', 'Location'], rows);
  }

  async function exportMonthly() {
    const rows = employees.map((employee) => {
      const records = attendance.filter((record) => record.employee_id === employee.id && record.date.startsWith(month));
      const present = records.filter((record) => record.status === 'Present').length;
      const late = records.filter((record) => record.status === 'Late').length;
      return [employee.full_name, employee.department || '', employee.designation || '', records.length, present, late, Math.max(records.length - present - late, 0)];
    });
    await downloadCsv(`monthly-attendance-${month}.csv`, ['Employee Name', 'Department', 'Designation', 'Attendance Entries', 'Present', 'Late', 'Absent'], rows);
  }

  async function saveEmployee(values: Omit<Employee, 'id'>) {
    const payload = { ...values, phone: values.phone ? cleanPhone(values.phone) : null };
    const result = editingEmployee
      ? await supabase.from('employees').update(payload).eq('id', editingEmployee.id).select().single()
      : await supabase.from('employees').insert(payload).select().single();
    if (result.error) {
      Alert.alert('Could not save employee', result.error.message);
      return;
    }
    const saved = result.data as Employee;
    setEmployees((current) => editingEmployee ? current.map((item) => item.id === saved.id ? saved : item) : [...current, saved].sort((a, b) => a.full_name.localeCompare(b.full_name)));
    setSelectedEmployee(saved);
    setShowEmployeeForm(false);
    setEditingEmployee(null);
  }

  async function saveEmployeeStatus(employeeId: string, status: string) {
    const existing = attendance.find((record) => record.employee_id === employeeId && record.date === today);
    const result = existing
      ? await supabase.from('attendance').update({ status }).eq('id', existing.id)
      : await supabase.from('attendance').insert({ employee_id: employeeId, date: today, status, time_in: status === 'Absent' ? null : new Date().toTimeString().slice(0, 8) });
    if (result.error) {
      Alert.alert('Could not update status', result.error.message);
      return;
    }
    const refreshed = await supabase.from('attendance').select('*').order('date', { ascending: false });
    setAttendance((refreshed.data || []) as AdminAttendance[]);
  }

  return (
    <SafeAreaView style={styles.appScreen}>
      <StatusBar style="light" />
      <Header title="Admin portal" subtitle="Operations overview" onLogout={onLogout} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageEyebrow}>CONTROL CENTER</Text><Text style={styles.pageTitle}>Dashboard overview</Text><Text style={styles.pageSubtitle}>A clear view of your workforce.</Text>
        <View style={styles.adminStatGrid}>
          <View style={[styles.adminStatCard, styles.adminBlueCard]}><Text style={styles.adminStatLabel}>TOTAL EMPLOYEES</Text><Text style={styles.adminStatValue}>{loading ? '--' : employees.length}</Text><Text style={styles.adminStatHint}>Registered profiles</Text></View>
          <View style={[styles.adminStatCard, styles.adminGreenCard]}><Text style={styles.adminStatLabel}>PRESENT TODAY</Text><Text style={styles.adminStatValue}>{loading ? '--' : presentCount}</Text><Text style={styles.adminStatHint}>On time check-ins</Text></View>
          <View style={[styles.adminStatCard, styles.adminYellowCard]}><Text style={styles.adminStatLabel}>LATE TODAY</Text><Text style={styles.adminStatValue}>{loading ? '--' : lateCount}</Text><Text style={styles.adminStatHint}>Late check-ins</Text></View>
          <View style={[styles.adminStatCard, styles.adminRedCard]}><Text style={styles.adminStatLabel}>ABSENT TODAY</Text><Text style={styles.adminStatValue}>{loading ? '--' : absentCount}</Text><Text style={styles.adminStatHint}>No check-in yet</Text></View>
        </View>
        <View style={styles.exportSection}><View><Text style={styles.sectionTitle}>Attendance reports</Text><Text style={styles.mutedText}>Download clean CSV reports for your records.</Text></View><View style={styles.exportButtons}><Pressable style={styles.exportButton} onPress={exportDaily}><Text style={styles.exportButtonText}>Daily CSV</Text></Pressable><Pressable style={[styles.exportButton, styles.monthlyButton]} onPress={exportMonthly}><Text style={styles.exportButtonText}>Monthly CSV</Text></Pressable></View></View>
        <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>Employee directory</Text><Text style={styles.sectionMeta}>{employees.length} total</Text></View><Pressable style={styles.addButton} onPress={() => { setEditingEmployee(null); setShowEmployeeForm(true); }}><Text style={styles.addButtonText}>+ Add employee</Text></Pressable></View>
        <View style={styles.listCard}>{employees.map((item) => <Pressable key={item.id} style={styles.employeeRow} onPress={() => setSelectedEmployee(item)}><View style={styles.avatarSmall}><Text style={styles.avatarSmallText}>{item.full_name.slice(0, 1).toUpperCase()}</Text></View><View style={styles.employeeInfo}><Text style={styles.employeeName}>{item.full_name}</Text><Text style={styles.mutedText}>{item.department || 'Unassigned'}  |  {item.designation || 'Employee'}</Text></View><Text style={styles.rowChevron}>›</Text></Pressable>)}</View>
      </ScrollView>
      {selectedEmployee && <EmployeeDetails employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} onEdit={() => { setEditingEmployee(selectedEmployee); setSelectedEmployee(null); setShowEmployeeForm(true); }} />}
      {showEmployeeForm && <EmployeeForm employee={editingEmployee} initialStatus={editingEmployee ? attendance.find((record) => record.employee_id === editingEmployee.id && record.date === today)?.status || 'Absent' : 'Absent'} onClose={() => { setShowEmployeeForm(false); setEditingEmployee(null); }} onSave={async (values, status) => { await saveEmployee(values); if (editingEmployee) await saveEmployeeStatus(editingEmployee.id, status); }} />}
    </SafeAreaView>
  );
}

function EmployeeDetails({ employee, onClose, onEdit }: { employee: Employee; onClose: () => void; onEdit: () => void }) {
  return <View style={styles.overlay}><View style={styles.modal}><View style={styles.modalHeader}><Text style={styles.modalTitle}>Employee details</Text><Pressable onPress={onClose}><Text style={styles.closeText}>×</Text></Pressable></View><View style={styles.detailHero}><View style={styles.detailAvatar}><Text style={styles.detailAvatarText}>{employee.full_name.slice(0, 1).toUpperCase()}</Text></View><Text style={styles.detailName}>{employee.full_name}</Text><Text style={styles.mutedText}>{employee.designation || 'Employee'}</Text></View><View style={styles.detailList}><DetailLine label="Phone number" value={employee.phone || 'Not provided'} /><DetailLine label="Department" value={employee.department || 'Not assigned'} /><DetailLine label="Role" value={employee.role || 'Employee'} /></View><View style={styles.modalActions}><Pressable style={styles.secondaryButton} onPress={onClose}><Text style={styles.secondaryButtonText}>Close</Text></Pressable><Pressable style={styles.primarySmallButton} onPress={onEdit}><Text style={styles.primaryButtonText}>Edit employee</Text></Pressable></View></View></View>;
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return <View style={styles.detailLine}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>;
}

function EmployeeForm({ employee, initialStatus, onClose, onSave }: { employee: Employee | null; initialStatus: string; onClose: () => void; onSave: (values: Omit<Employee, 'id'>, status: string) => Promise<void> }) {
  const [fullName, setFullName] = useState(employee?.full_name || '');
  const [phone, setPhone] = useState(employee?.phone || '');
  const [department, setDepartment] = useState(employee?.department || '');
  const [designation, setDesignation] = useState(employee?.designation || '');
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  async function submit() {
    if (!fullName.trim()) { Alert.alert('Name required', 'Enter the employee name.'); return; }
    setSaving(true);
    await onSave({ full_name: fullName.trim(), phone: phone.trim() || null, department: department.trim() || null, designation: designation.trim() || null, role: employee?.role || 'employee' }, status);
    setSaving(false);
  }
  return <View style={styles.overlay}><View style={styles.modal}><View style={styles.modalHeader}><Text style={styles.modalTitle}>{employee ? 'Edit employee' : 'Add employee'}</Text><Pressable onPress={onClose}><Text style={styles.closeText}>×</Text></Pressable></View><ScrollView><Text style={styles.formLabel}>Full name</Text><TextInput value={fullName} onChangeText={setFullName} style={styles.formInput} placeholder="Employee name" /><Text style={styles.formLabel}>Phone number</Text><TextInput value={phone} onChangeText={setPhone} style={styles.formInput} keyboardType="phone-pad" placeholder="Registered phone number" /><Text style={styles.formLabel}>Department</Text><TextInput value={department} onChangeText={setDepartment} style={styles.formInput} placeholder="Department or program" /><Text style={styles.formLabel}>Designation</Text><TextInput value={designation} onChangeText={setDesignation} style={styles.formInput} placeholder="Job designation" /><Text style={styles.formLabel}>Today's attendance status</Text><View style={styles.statusChoices}>{['Present', 'Late', 'Absent'].map((option) => <Pressable key={option} style={[styles.statusChoice, status === option && (option === 'Present' ? styles.presentChoice : option === 'Late' ? styles.lateChoice : styles.absentChoice)]} onPress={() => setStatus(option)}><Text style={[styles.statusChoiceText, status === option && styles.selectedStatusText]}>{option}</Text></Pressable>)}</View></ScrollView><View style={styles.modalActions}><Pressable style={styles.secondaryButton} onPress={onClose}><Text style={styles.secondaryButtonText}>Cancel</Text></Pressable><Pressable style={styles.primarySmallButton} onPress={submit} disabled={saving}>{saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryButtonText}>{employee ? 'Save changes' : 'Add employee'}</Text>}</Pressable></View></View></View>;
}

const styles = StyleSheet.create({
  fontLoading: { flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
  loginScreen: { flex: 1, backgroundColor: colors.navy },
  loginKeyboard: { flex: 1 },
  loginContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  loginBrand: { paddingHorizontal: 4, paddingBottom: 28 },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandMark: { width: 50, height: 50, borderRadius: 15, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  brandMarkText: { color: colors.white, fontSize: 26, fontWeight: '800' },
  brandKicker: { color: '#91B5FF', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 2 },
  brandTitle: { color: colors.white, fontSize: 30, fontWeight: '800', letterSpacing: -0.7 },
  brandSubtitle: { color: '#AEBBD2', fontSize: 15, marginTop: 12 },
  loginCard: { backgroundColor: colors.white, borderRadius: 24, padding: 24, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  cardAccent: { height: 4, backgroundColor: colors.blue, position: 'absolute', left: 0, right: 0, top: 0 },
  eyebrow: { color: colors.blue, fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 10 },
  loginTitle: { color: colors.ink, fontSize: 24, fontWeight: '800', fontFamily: 'Manrope_800ExtraBold' },
  loginCopy: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 24 },
  label: { color: colors.ink, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 15, height: 52, color: colors.ink, fontSize: 16, backgroundColor: '#FBFCFE' },
  primaryButton: { backgroundColor: colors.blue, borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  primaryButtonText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  loginHint: { color: '#8B97A9', fontSize: 12, textAlign: 'center', marginTop: 14 },
  appScreen: { flex: 1, backgroundColor: colors.canvas },
  header: { backgroundColor: colors.navy, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerBrand: { flexDirection: 'row', alignItems: 'center' },
  smallMark: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  smallMarkText: { color: colors.white, fontSize: 18, fontWeight: '800' },
  headerTitle: { color: colors.white, fontSize: 16, fontWeight: '800', fontFamily: 'Manrope_800ExtraBold' },
  headerSubtitle: { color: '#AEBBD2', fontSize: 11, marginTop: 2 },
  logoutButton: { borderWidth: 1, borderColor: '#40506D', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  logoutText: { color: '#D9E2F2', fontSize: 12, fontWeight: '700' },
  content: { padding: 20, paddingBottom: 36 },
  pageEyebrow: { color: colors.blue, fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginTop: 4 },
  pageTitle: { color: colors.ink, fontSize: 27, fontWeight: '800', marginTop: 7, fontFamily: 'Manrope_800ExtraBold' },
  pageSubtitle: { color: colors.muted, fontSize: 14, marginTop: 5 },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginTop: 22, marginBottom: 16 },
  avatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#DCE8FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: colors.blue, fontSize: 20, fontWeight: '800' },
  profileName: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  mutedText: { color: colors.muted, fontSize: 12, marginTop: 3 },
  statusCard: { backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  presentStatusCard: { backgroundColor: '#ECFDF5', borderColor: '#B7E9D7' },
  lateStatusCard: { backgroundColor: '#FFF8E6', borderColor: '#F5D58A' },
  absentStatusCard: { backgroundColor: '#FFF1F2', borderColor: '#F3C1C7' },
  pendingStatusCard: { backgroundColor: colors.white },
  cardEyebrow: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  statusValue: { color: colors.ink, fontSize: 21, fontWeight: '800', marginTop: 5 },
  statusDot: { width: 14, height: 14, borderRadius: 7 },
  presentStatusDot: { backgroundColor: colors.teal },
  lateStatusDot: { backgroundColor: '#E6A817' },
  absentStatusDot: { backgroundColor: '#E0525D' },
  pendingStatusDot: { backgroundColor: '#AAB5C5' },
  mapCard: { backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.line, overflow: 'hidden', marginTop: 12 },
  mapHeader: { padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  locationLabel: { color: colors.ink, fontSize: 13, fontWeight: '700', marginTop: 4, maxWidth: 260 },
  locationPin: { color: colors.teal, backgroundColor: '#DDF6EF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, fontSize: 10, fontWeight: '800' },
  attendanceButton: { height: 54, borderRadius: 14, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  disabledButton: { backgroundColor: '#AAB5C5' },
  attendanceButtonText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 11 },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '800', fontFamily: 'Manrope_700Bold' },
  sectionMeta: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  listCard: { backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  emptyText: { color: colors.muted, padding: 20, textAlign: 'center' },
  historyRow: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#EFF2F6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyInfo: { flex: 1, paddingRight: 12 },
  historyDate: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  locationText: { color: colors.blue, fontSize: 11, marginTop: 3 },
  badge: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6, fontSize: 11, fontWeight: '800', overflow: 'hidden' },
  presentBadge: { color: '#087963', backgroundColor: '#DDF6EF' },
  lateBadge: { color: '#986313', backgroundColor: '#FFF0D0' },
  statGrid: { flexDirection: 'row', gap: 12, marginTop: 22 },
  statCard: { backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: 16, flex: 1 },
  statValue: { color: colors.ink, fontSize: 29, fontWeight: '800', marginTop: 7 },
  statLabel: { color: colors.muted, fontSize: 12, marginTop: 3 },
  adminStatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 22 },
  adminStatCard: { width: '48%', minHeight: 116, borderRadius: 17, padding: 15, borderWidth: 1 },
  adminBlueCard: { backgroundColor: '#EEF4FF', borderColor: '#D6E4FF' },
  adminGreenCard: { backgroundColor: '#ECFDF5', borderColor: '#C8F0E1' },
  adminYellowCard: { backgroundColor: '#FFF8E6', borderColor: '#F5E0A8' },
  adminRedCard: { backgroundColor: '#FFF1F2', borderColor: '#F5CDD2' },
  adminStatLabel: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  adminStatValue: { color: colors.ink, fontSize: 28, fontWeight: '800', marginTop: 7 },
  adminStatHint: { color: colors.muted, fontSize: 11, marginTop: 2 },
  exportSection: { backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: 16, marginTop: 22 },
  exportButtons: { flexDirection: 'row', gap: 9, marginTop: 14 },
  exportButton: { backgroundColor: colors.blue, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, flex: 1, alignItems: 'center' },
  monthlyButton: { backgroundColor: colors.navy },
  exportButtonText: { color: colors.white, fontSize: 12, fontWeight: '800' },
  employeeRow: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#EFF2F6', flexDirection: 'row', alignItems: 'center' },
  avatarSmall: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#E5ECF7', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  avatarSmallText: { color: '#53627A', fontWeight: '800' },
  employeeInfo: { flex: 1 },
  employeeName: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  rowChevron: { color: '#98A5B8', fontSize: 22, marginLeft: 8 },
  addButton: { backgroundColor: colors.blue, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  addButtonText: { color: colors.white, fontSize: 11, fontWeight: '800' },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(16, 27, 51, 0.55)', alignItems: 'center', justifyContent: 'center', padding: 18, zIndex: 10 },
  modal: { width: '100%', maxHeight: '88%', backgroundColor: colors.white, borderRadius: 22, padding: 20, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { color: colors.ink, fontSize: 19, fontWeight: '800' },
  closeText: { color: colors.muted, fontSize: 28, lineHeight: 28 },
  detailHero: { alignItems: 'center', paddingVertical: 6, marginBottom: 18 },
  detailAvatar: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#DCE8FF', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  detailAvatarText: { color: colors.blue, fontSize: 27, fontWeight: '800' },
  detailName: { color: colors.ink, fontSize: 19, fontWeight: '800' },
  detailList: { backgroundColor: '#F7F9FC', borderRadius: 14, paddingHorizontal: 15 },
  detailLine: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  detailLabel: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  detailValue: { color: colors.ink, fontSize: 14, fontWeight: '700', marginTop: 3 },
  modalActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 18 },
  secondaryButton: { backgroundColor: '#EEF2F7', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 11 },
  secondaryButtonText: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  primarySmallButton: { backgroundColor: colors.blue, borderRadius: 10, paddingHorizontal: 15, paddingVertical: 11, minWidth: 110, alignItems: 'center' },
  formLabel: { color: colors.ink, fontSize: 12, fontWeight: '800', marginTop: 10, marginBottom: 6 },
  formInput: { borderWidth: 1, borderColor: colors.line, borderRadius: 11, paddingHorizontal: 13, height: 46, color: colors.ink, fontSize: 14, backgroundColor: '#FBFCFE' },
  statusChoices: { flexDirection: 'row', gap: 8 },
  statusChoice: { flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingVertical: 11, alignItems: 'center', backgroundColor: '#FBFCFE' },
  presentChoice: { backgroundColor: '#159A82', borderColor: '#159A82' },
  lateChoice: { backgroundColor: '#E6A817', borderColor: '#E6A817' },
  absentChoice: { backgroundColor: '#E0525D', borderColor: '#E0525D' },
  statusChoiceText: { color: colors.ink, fontSize: 11, fontWeight: '800' },
  selectedStatusText: { color: colors.white },
});
