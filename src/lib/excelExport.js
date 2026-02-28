import * as XLSX from 'xlsx';

export const exportToExcel = (data, filename) => {
    if (!data || !data.length) {
        alert('No data to export');
        return;
    }

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Performance Report');

    // Write file
    XLSX.writeFile(workbook, filename);
};
