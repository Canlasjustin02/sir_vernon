export function generateOrderNo() {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const randomPart = randomUppercase(3);
    return `ORD-${mm}${dd}-${randomPart}`;
}
export function generateBankReference() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const randomPart = randomUppercase(4);
    return `REF-${yyyy}${mm}${dd}-${randomPart}`;
}
export function generateInventoryId() {
    const randomPart = randomUppercase(4);
    return `INV-${randomPart}`;
}
export function generateReportCode(year, sequence) {
    return `REP-${year}-${sequence.toString().padStart(4, '0')}`;
}
function randomUppercase(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let out = '';
    for (let i = 0; i < length; i++) {
        const idx = Math.floor(Math.random() * chars.length);
        out += chars[idx];
    }
    return out;
}
