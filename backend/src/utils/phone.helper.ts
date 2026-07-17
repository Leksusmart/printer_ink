export function normalizePhone(phone: string): string {
    let checkedPhone = phone.trim();
    if (checkedPhone.length === 11 && checkedPhone.startsWith('7')) {
        checkedPhone = '+' + checkedPhone;
    } else if (checkedPhone.length === 11 && checkedPhone.startsWith('8')) {
        checkedPhone = '+7' + checkedPhone.slice(1);
    }
    return checkedPhone;
}
