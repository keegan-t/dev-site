const BIRTH_DATE = new Date(import.meta.env.BIRTH_DATE);

export function getAge() {
    const now = new Date();
    let age = now.getFullYear() - BIRTH_DATE.getFullYear();
    const birthdayThisYear =
        now.getMonth() > BIRTH_DATE.getMonth() ||
        (now.getMonth() === BIRTH_DATE.getMonth() && now.getDate() >= BIRTH_DATE.getDate());
    if (!birthdayThisYear) age--;
    return age;
}
