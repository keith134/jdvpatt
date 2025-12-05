import { AppData, AttendanceStatus, TOTAL_DAYS } from '../types';

export const exportToCSV = (data: AppData) => {
  // 1. Build Header
  let csvContent = "data:text/csv;charset=utf-8,";
  
  const headerRow = [
    "Student ID",
    "Name",
    "School ID",
    "Strand",
    ...Array.from({ length: TOTAL_DAYS }, (_, i) => `Day ${i + 1}`),
    "Total Present",
    "Total Absent",
    "Total Late"
  ];
  
  csvContent += headerRow.join(",") + "\r\n";

  // 2. Build Body
  data.students.forEach(student => {
    const record = data.attendance[student.id] || {};
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;

    const dayColumns = Array.from({ length: TOTAL_DAYS }, (_, i) => {
      const status = record[i + 1] || AttendanceStatus.NONE;
      if (status === AttendanceStatus.PRESENT) presentCount++;
      if (status === AttendanceStatus.ABSENT) absentCount++;
      if (status === AttendanceStatus.LATE) lateCount++;
      return status;
    });

    const row = [
      `"${student.id}"`,
      `"${student.name}"`,
      `"${student.schoolId}"`,
      `"${student.strand}"`,
      ...dayColumns,
      presentCount,
      absentCount,
      lateCount
    ];

    csvContent += row.join(",") + "\r\n";
  });

  // 3. Trigger Download
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  const filename = `JDVP_Attendance_40Days_${new Date().toISOString().split('T')[0]}.csv`;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = (data: AppData) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `JDVP_Backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
