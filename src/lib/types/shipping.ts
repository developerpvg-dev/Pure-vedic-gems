export type ShippingCountry = {
  code: string;
  name: string;
  requires_indian_pincode: boolean;
  sort_order: number;
};

export type ShippingPlan = {
  id: string;
  label: string;
  description: string | null;
  cost: number;
  estimated_days_min: number | null;
  estimated_days_max: number | null;
  country_code: string;
  sort_order: number;
};

export type SelectedShippingPlan = Pick<ShippingPlan, 'id' | 'label' | 'cost' | 'country_code'>;
