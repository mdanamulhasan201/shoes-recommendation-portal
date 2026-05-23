export const LANGS = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "cs", label: "Čeština", flag: "🇨🇿" },
] as const;

type Dict = Record<string, string>;
const DICTS: Record<string, Dict> = {
  en: {
    welcome: "Welcome",
    tap_to_begin: "Touch screen to start",
    select_language: "Select your language",
    new_rental: "Start new rental",
    pickup: "Pick up reservation",
    return: "Return equipment",
  },
  de: {
    welcome: "Willkommen",
    tap_to_begin: "Bildschirm berühren um zu starten",
    select_language: "Sprache auswählen",
    new_rental: "Neue Ausleihe",
    pickup: "Reservierung abholen",
    return: "Ausrüstung zurückgeben",
  },
  fr: {
    welcome: "Bienvenue",
    tap_to_begin: "Touchez l'écran pour commencer",
    select_language: "Choisissez votre langue",
    new_rental: "Nouvelle location",
    pickup: "Récupérer la réservation",
    return: "Retourner l'équipement",
  },
  it: {
    welcome: "Benvenuto",
    tap_to_begin: "Tocca per iniziare",
    select_language: "Seleziona lingua",
    new_rental: "Nuovo noleggio",
    pickup: "Ritira prenotazione",
    return: "Restituisci attrezzatura",
  },
  nl: {
    welcome: "Welkom",
    tap_to_begin: "Raak het scherm aan",
    select_language: "Selecteer taal",
    new_rental: "Nieuwe verhuur",
    pickup: "Reservering ophalen",
    return: "Retourneer materiaal",
  },
  ru: {
    welcome: "Добро пожаловать",
    tap_to_begin: "Коснитесь экрана",
    select_language: "Выберите язык",
    new_rental: "Новая аренда",
    pickup: "Получить бронь",
    return: "Вернуть снаряжение",
  },
  pl: {
    welcome: "Witamy",
    tap_to_begin: "Dotknij ekran",
    select_language: "Wybierz język",
    new_rental: "Nowy wynajem",
    pickup: "Odbiór rezerwacji",
    return: "Zwrot sprzętu",
  },
  cs: {
    welcome: "Vítejte",
    tap_to_begin: "Dotkněte se obrazovky",
    select_language: "Vyberte jazyk",
    new_rental: "Nový pronájem",
    pickup: "Vyzvednutí rezervace",
    return: "Vrátit vybavení",
  },
};

export function t(lang: string, key: keyof (typeof DICTS)["en"]): string {
  return DICTS[lang]?.[key] ?? DICTS.en[key] ?? key;
}
