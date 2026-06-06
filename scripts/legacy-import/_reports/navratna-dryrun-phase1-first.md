# Navratna Phase 1 — Dry-Run Report `phase1-first`

- Generated: 2026-05-28T20:57:39.797Z
- Target DB host: `db.gsrbscmpivnwvydvfplx.supabase.co`

## Headline
- **Products to promote:** 1734
- **Redirect rows:** 16075
- **Media url map total:** 3786
- **Products with at least one warning:** 1725

## Distribution
### By sub_category
| Sub-category | Count |
|---|---:|
| red-coral | 296 |
| ruby | 276 |
| emerald | 252 |
| pearl | 250 |
| yellow-sapphire | 247 |
| blue-sapphire | 167 |
| white-sapphire | 88 |
| hessonite | 80 |
| cats-eye | 78 |

### By quality_label
| Quality | Count |
|---|---:|
| Luxury | 388 |
| Exclusive | 343 |
| Super Premium | 246 |
| Good | 229 |
| Premium | 211 |
| Economy | 135 |
| Super Luxury | 129 |
| (none) | 34 |
| Best | 5 |
| Economi | 5 |
| Best Quality | 2 |
| Laxury | 2 |
| Econoy | 1 |
| Luxur | 1 |
| Super Laxury | 1 |
| Super Lucury | 1 |
| Super Premiu | 1 |

### By stock_status
| Status | Count |
|---|---:|
| in_stock | 1030 |
| out_of_stock | 704 |

## Pricing
- Total rows: 1734
- Missing or zero price: **343**
- Min / avg / max: 860 / 38,079.69 / 6,52,765
- Rows with discount (compare_price > price): 1391

## Media
### URL map status
| Status | Count |
|---|---:|
| ok | 1959 |
| pending | 1827 |

### Per-product coverage
- Products with at least one OK image: **1035 / 1734**
- Products with at least one failed image: 0
- Products with an unmapped attachment id: 0

## Warnings (rollup)
| Code | Count |
|---|---:|
| null | 2074 |

## Redirects
| Source label | Count |
|---|---:|
| product_root | 6430 |
| shop_navratan | 6430 |
| product_category_navratan | 3215 |

## Duplicates (top 20)
### Duplicate SKUs
_None._

### Duplicate slugs
_None._

## Diff vs `public.products`
_Canonical `public.products` table not present in target DB — skipping diff._

## Samples (top 3 by price per sub_category)
### red-coral
| legacy_id | SKU | Name | Price | ct | Quality | Images | Warnings |
|---|---|---|---:|---:|---|---:|---:|
| 47518 | X803.. | Japanese Red Coral 12.48ct.@8757 per. ct. | 1,09,375 | 12.48 | Good | 2 | 1 |
| 47548 | Z179.. | Japanese Red Coral 11.44ct.@8754per. ct. | 1,00,146 | 11.44 | Good | 2 | 1 |
| 47516 | U108.. | Japanese Red Coral 10.49ct.@8756 per. ct. | 91,855 | 10.49 | Good | 2 | 1 |

### ruby
| legacy_id | SKU | Name | Price | ct | Quality | Images | Warnings |
|---|---|---|---:|---:|---|---:|---:|
| 37016 | X576.. | African Ruby 25.33ct.@25750 per. ct. (Luxury) | 6,52,765 | 25.33 | Luxury | 3 | 1 |
| 45683 | M732.. | African Ruby 10.40ct.@48924per. ct. (Super Luxury) | 5,08,810 | 10.4 | Super Luxury | 2 | 1 |
| 46679 | E942... | African Ruby 10.36ct.@38625 per. ct. (Super Luxury) | 4,00,155 | 10.36 | Super Luxury | 2 | 1 |

### emerald
| legacy_id | SKU | Name | Price | ct | Quality | Images | Warnings |
|---|---|---|---:|---:|---|---:|---:|
| 46395 | F931... | Emerald 4.93ct.@50747per. ct.(Super Luxury) | 2,50,187 | 4.93 | Super Luxury | 3 | 1 |
| 42557 | E424.. | Emerald 5.50ct.@36705 per. ct.(Super Luxury) | 2,01,880 | 5.5 | Super Luxury | 3 | 1 |
| 46397 | X734.. | Emerald 4.83ct.@41423 per. ct.(Super Luxury) | 2,00,077 | 4.83 | Super Luxury | 3 | 1 |

### pearl
| legacy_id | SKU | Name | Price | ct | Quality | Images | Warnings |
|---|---|---|---:|---:|---|---:|---:|
| 31245 | I248.. | Keshi Pearl 15.93ct@978 per. ct. (Luxury) | 15,575 | 15.93 | Luxury | 1 | 1 |
| 31249 | J908.. | Keshi Pearl 14.17ct@977 per. ct. (Luxury) | 13,845 | 14.17 | Luxury | 1 | 1 |
| 23112 | G133. | Keshi Pearl 14.56ct@950 per. ct. (Luxury) | 13,830 | 14.56 | Luxury | 1 | 1 |

### yellow-sapphire
| legacy_id | SKU | Name | Price | ct | Quality | Images | Warnings |
|---|---|---|---:|---:|---|---:|---:|
| 47054 | G654. | Yellow Sapphire 8.90ct.@27292per. ct. (Super Luxury) | 2,42,904 | 8.9 | Super Luxury | 3 | 1 |
| 43528 | V894.. | Yellow Sapphire 6.20ct.@33260per. ct.(Super Luxury) | 2,06,200 | 6.2 | Super Luxury | 3 | 1 |
| 27279 | Q478. | Yellow Sapphire 8.30ct.@23650 per. ct. (Super Luxury) | 1,96,300 | 8.3 | Super Luxury | 3 | 1 |

### blue-sapphire
| legacy_id | SKU | Name | Price | ct | Quality | Images | Warnings |
|---|---|---|---:|---:|---|---:|---:|
| 40866 | A758.. | Blue Sapphire 15.55ct.@25765 per. ct. (Luxury) | 4,00,650 | 15.55 | Luxury | 4 | 1 |
| 35581 | K239.. | Blue Sapphire 8.16ct.@38620 per. ct. (Super Luxury) | 3,15,140 | 8.16 | Super Luxury | 3 | 1 |
| 34550 | I820.. | Blue Sapphire 7.50ct.@37600 per. ct. (Super Luxury) | 2,82,000 | 7.5 | Super Luxury | 3 | 1 |

### white-sapphire
| legacy_id | SKU | Name | Price | ct | Quality | Images | Warnings |
|---|---|---|---:|---:|---|---:|---:|
| 34498 | O720.. | White Sapphire 5.66ct.@45490per. ct.(Super Luxury) | 2,57,470 | 5.66 | Super Luxury | 3 | 1 |
| 1614 | O898 | White Sapphire 6.99ct.@27200 per. ct. (Super Luxury) | 1,90,130 | 6.99 | Super Luxury | 3 | 1 |
| 33241 | B394... | White Sapphire 8.44ct.@21357 per. ct. (Luxury) | 1,80,250 | 8.44 | Luxury | 3 | 1 |

### hessonite
| legacy_id | SKU | Name | Price | ct | Quality | Images | Warnings |
|---|---|---|---:|---:|---|---:|---:|
| 48225 | W853.. | Hessonite 13.72ct.@1855per. ct. (Super Luxury) | 25,451 | 13.72 | Super Luxury | 1 | 1 |
| 48221 | P506.. | Hessonite 13.10ct.@1854per. ct. (Super Luxury) | 24,297 | 13.1 | Super Luxury | 1 | 1 |
| 48223 | S146.. | Hessonite 12.60ct.@1853per. ct. (Super Luxury) | 23,360 | 12.6 | Super Luxury | 1 | 1 |

### cats-eye
| legacy_id | SKU | Name | Price | ct | Quality | Images | Warnings |
|---|---|---|---:|---:|---|---:|---:|
| 4357 | D408 | Catseye 9.57ct.@12600 per. ct. (Luxury) | 1,20,580 | 9.57 | Luxury | 4 | 1 |
| 37874 | L204... | Catseye 6.83ct.@16996 per. ct. (Super Luxury) | 1,16,080 | 6.83 | Super Luxury | 2 | 1 |
| 35601 | G736.. | Catseye 5.20ct.@19565 per. ct. (Super Luxury) | 1,01,740 | 5.2 | Super Luxury | 5 | 1 |
