export type Marketplace = 'wb' | 'ozon' | 'yandex';

export type FieldConfig = {
  key: string;
  label: string;
  type?: 'text' | 'number';
  half?: boolean;
};

export type SectionConfig = {
  title: string;
  fields: FieldConfig[];
};

export type FormData = Record<string, string | number>;

export const VAT_RATES_BY_MODE: Record<string, number[]> = {
  none: [0],
  self_employed: [0],
  usn_6: [0, 5, 7, 22],
  usn_15: [0, 5, 7, 22],
  osno: [0, 10, 22],
};

export const TAX_MODES = [
  { value: 'none', label: 'Без налога' },
  { value: 'self_employed', label: 'Самозанятый (НПД 6%)' },
  { value: 'usn_6', label: 'УСН «Доходы» (6%)' },
  { value: 'usn_15', label: 'УСН «Доходы − Расходы» (15%)' },
  { value: 'osno', label: 'ОСНО (налог на прибыль 25%)' },
];

export const WB_SECTIONS: SectionConfig[] = [
  {
    title: 'Данные товара',
    fields: [
      { key: 'name', label: 'Название товара', type: 'text' },
      { key: 'selling_price', label: 'Цена продажи, ₽', half: true },
      { key: 'quantity', label: 'Количество, шт', half: true },
      { key: 'cost_price', label: 'Себестоимость, ₽', half: true },
      { key: 'packaging_cost', label: 'Упаковка, ₽', half: true },
    ],
  },
  {
    title: 'Расходы Wildberries',
    fields: [
      { key: 'commission_percent', label: 'Комиссия WB, %', half: true },
      { key: 'logistics_cost', label: 'Логистика, ₽', half: true },
      { key: 'storage_cost', label: 'Хранение, ₽', half: true },
      { key: 'acquiring_percent', label: 'Эквайринг, %', half: true },
      { key: 'ads_cost', label: 'Реклама, ₽', half: true },
      { key: 'return_rate_percent', label: 'Возвраты, %', half: true },
    ],
  },
];

export const OZON_SECTIONS: SectionConfig[] = [
  {
    title: 'Данные товара',
    fields: [
      { key: 'name', label: 'Название товара', type: 'text' },
      { key: 'selling_price', label: 'Цена продажи, ₽', half: true },
      { key: 'quantity', label: 'Количество, шт', half: true },
      { key: 'cost_price', label: 'Себестоимость, ₽', half: true },
      { key: 'packaging_cost', label: 'Упаковка, ₽', half: true },
    ],
  },
  {
    title: 'Расходы Ozon',
    fields: [
      { key: 'commission_percent', label: 'Комиссия Ozon, %', half: true },
      { key: 'acquiring_percent', label: 'Эквайринг Ozon Pay, %', half: true },
      { key: 'logistics_base', label: 'Логистика: база, ₽', half: true },
      { key: 'logistics_per_liter', label: 'Надбавка за литр, ₽', half: true },
      { key: 'volume_liters', label: 'Объём, л', half: true },
      { key: 'last_mile_percent', label: 'Последняя миля, %', half: true },
      { key: 'last_mile_max', label: 'Макс. последней мили, ₽', half: true },
      { key: 'storage_cost', label: 'Хранение, ₽', half: true },
      { key: 'ads_cost', label: 'Реклама, ₽', half: true },
      { key: 'return_rate_percent', label: 'Возвраты, %', half: true },
      { key: 'return_utilization_cost', label: 'Утилизация возврата, ₽', half: true },
    ],
  },
];

export const YANDEX_SECTIONS: SectionConfig[] = [
  {
    title: 'Данные товара',
    fields: [
      { key: 'name', label: 'Название товара', type: 'text' },
      { key: 'selling_price', label: 'Цена продажи, ₽', half: true },
      { key: 'quantity', label: 'Количество, шт', half: true },
      { key: 'cost_price', label: 'Себестоимость, ₽', half: true },
      { key: 'packaging_cost', label: 'Упаковка, ₽', half: true },
    ],
  },
  {
    title: 'Расходы Яндекс Маркет',
    fields: [
      { key: 'commission_percent', label: 'Комиссия Маркета, %', half: true },
      { key: 'acquiring_percent', label: 'Эквайринг, %', half: true },
      { key: 'logistics_first_liter', label: 'Логистика: 1-й литр, ₽', half: true },
      { key: 'logistics_per_additional_liter', label: 'Логистика: за литр, ₽', half: true },
      { key: 'logistics_max', label: 'Макс. логистики, ₽', half: true },
      { key: 'volume_liters', label: 'Объём, л', half: true },
      { key: 'delivery_percent', label: 'Доставка покупателю, %', half: true },
      { key: 'delivery_max', label: 'Макс. доставки, ₽', half: true },
      { key: 'order_processing', label: 'Обработка заказа, ₽', half: true },
      { key: 'storage_cost', label: 'Хранение, ₽', half: true },
      { key: 'ads_cost', label: 'Реклама, ₽', half: true },
      { key: 'return_rate_percent', label: 'Возвраты, %', half: true },
      { key: 'return_utilization_cost', label: 'Утилизация, ₽', half: true },
    ],
  },
];

export const INITIAL_WB: FormData = {
  name: 'Футболка хлопок',
  selling_price: 1000, quantity: 10,
  cost_price: 300, packaging_cost: 20,
  commission_percent: 20, logistics_cost: 80, storage_cost: 10,
  acquiring_percent: 0, ads_cost: 50, return_rate_percent: 0,
  tax_mode: 'usn_6', vat_rate: 0,
};

export const INITIAL_OZON: FormData = {
  name: 'Футболка хлопок',
  selling_price: 1000, quantity: 10,
  cost_price: 300, packaging_cost: 20,
  commission_percent: 15,
  logistics_base: 46.77, logistics_per_liter: 10.17, volume_liters: 1,
  last_mile_percent: 5.5, last_mile_max: 500,
  acquiring_percent: 2.2, storage_cost: 0, ads_cost: 50,
  return_rate_percent: 0, return_utilization_cost: 0,
  tax_mode: 'usn_6', vat_rate: 0,
};

export const INITIAL_YANDEX: FormData = {
  name: 'Футболка хлопок',
  selling_price: 1000, quantity: 10,
  cost_price: 300, packaging_cost: 20,
  commission_percent: 20,
  logistics_first_liter: 80, logistics_per_additional_liter: 9,
  logistics_max: 5500, volume_liters: 1,
  delivery_percent: 5, delivery_max: 1000,
  order_processing: 25,
  storage_cost: 0, acquiring_percent: 0, ads_cost: 50,
  return_rate_percent: 0, return_utilization_cost: 0,
  tax_mode: 'usn_6', vat_rate: 0,
};

export const MP_META: Record<Marketplace, { label: string; color: string; colorHover: string }> = {
  wb: { label: 'Wildberries FBO', color: 'bg-purple-600', colorHover: 'hover:bg-purple-700' },
  ozon: { label: 'Ozon FBO', color: 'bg-blue-600', colorHover: 'hover:bg-blue-700' },
  yandex: { label: 'Яндекс Маркет FBY', color: 'bg-yellow-500', colorHover: 'hover:bg-yellow-600' },
};
