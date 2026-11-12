/**
 * NIJEDEE - Instant Local Catalog & Stale-While-Revalidate Engine
 * Provides instant (0ms) first-paint loading for Shop products and Real Estate listings.
 * Background revalidation queries Supabase silently without blocking the user.
 *
 * STRICT RULE: ZERO Unicode Emojis. Clean SVG icons and accessible markup only.
 */

(function (window) {
  'use strict';

  // Seed Catalog (28 Authentic Products)
  const NIJEDEE_INITIAL_PRODUCTS = [
    {
        "id":  "02fceebe-98e4-491e-98c7-41dce3f8a6d8",
        "name":  "NIJEDEE Higher Satin (20L)",
        "category":  "paints",
        "brand":  "NIJEDEE Paints · 20 Litres",
        "badge":  "Higher Satin · 20L",
        "description":  "Top-tier silky luxury sheen washable paint. Brilliant colors, excellent coverage, and superior durability. Quality is our priority.",
        "price":  65000,
        "price_max":  null,
        "price_display":  "₦65,000",
        "variants":  [

                     ],
        "images":  [
                       "assets/images/shop/nijedee-higher-satin.jpg"
                   ],
        "image_url":  "assets/images/shop/nijedee-higher-satin.jpg",
        "keywords":  "nijedee paints higher satin 20l brilliant colors excellent coverage superior durability 65000",
        "in_stock":  true,
        "is_active":  true,
        "display_order":  1,
        "created_at":  "2026-11-04T22:14:46.23769+00:00",
        "updated_at":  "2026-11-08T04:27:38.797+00:00"
    },
    {
        "id":  "1809247b-d51d-4066-b2f1-909007e133a2",
        "name":  "NIJEDEE Matt Emulsion (20L)",
        "category":  "paints",
        "brand":  "NIJEDEE Paints · 20 Litres",
        "badge":  "Matt Emulsion · 20L",
        "description":  "Ultra-smooth non-reflective luxury finish for executive living rooms and interiors. Rich colors, superior coverage, and long-lasting finish.",
        "price":  55000,
        "price_max":  null,
        "price_display":  "₦55,000",
        "variants":  [

                     ],
        "images":  [
                       "assets/images/shop/nijedee-matt-emulsion.jpg"
                   ],
        "image_url":  "assets/images/shop/nijedee-matt-emulsion.jpg",
        "keywords":  "nijedee paints matt emulsion 20l rich colors superior coverage long lasting finish 55000",
        "in_stock":  true,
        "is_active":  true,
        "display_order":  2,
        "created_at":  "2026-11-04T22:14:46.23769+00:00",
        "updated_at":  "2026-11-04T22:14:46.23769+00:00"
    },
    {
        "id":  "c556d982-c546-499a-bed9-e1a73d34fbcf",
        "name":  "NIJEDEE Higher Emulsion (20L)",
        "category":  "paints",
        "brand":  "NIJEDEE Paints · 20 Litres",
        "badge":  "Higher Emulsion · 20L",
        "description":  "High-performance interior and exterior wall paint. Excellent formulation, superior coverage, and great durability for smooth, lasting walls.",
        "price":  20000,
        "price_max":  null,
        "price_display":  "₦20,000",
        "variants":  [

                     ],
        "images":  [
                       "assets/images/shop/nijedee-higher-emulsion.jpg"
                   ],
        "image_url":  "assets/images/shop/nijedee-higher-emulsion.jpg",
        "keywords":  "nijedee paints higher emulsion 20l excellent paint superior coverage great durability 20000",
        "in_stock":  true,
        "is_active":  true,
        "display_order":  3,
        "created_at":  "2026-11-04T22:14:46.23769+00:00",
        "updated_at":  "2026-11-04T22:14:46.23769+00:00"
    },
    {
        "id":  "1c145552-b4d5-464b-921f-2c13fef64c28",
        "name":  "Glass Dimmable Recessed POP LED Light",
        "category":  "lighting",
        "brand":  "Brand: Led Lighting · Recessed POP",
        "badge":  "Glass Dimmable · 3W–18W",
        "description":  "Energy-efficient decorative glass-rim recessed POP ceiling spotlight with heavy-duty clips and external isolated driver. Available in 3W, 6W, 12W, and 18W.",
        "price":  5548,
        "price_max":  7448,
        "price_display":  "₦5,548 – ₦7,448",
        "variants":  [
                         {
                             "label":  "3W Glass Recessed POP LED Light",
                             "price":  5548,
                             "display":  "3W Glass POP LED — ₦5,548"
                         },
                         {
                             "label":  "6W Glass Recessed POP LED Light",
                             "price":  6180,
                             "display":  "6W Glass POP LED — ₦6,180"
                         },
                         {
                             "label":  "12W Glass Recessed POP LED Light",
                             "price":  6850,
                             "display":  "12W Glass POP LED — ₦6,850"
                         },
                         {
                             "label":  "18W Glass Recessed POP LED Light",
                             "price":  7448,
                             "display":  "18W Glass POP LED — ₦7,448"
                         }
                     ],
        "images":  [
                       "assets/images/shop/glass-pop-led-lights.jpg"
                   ],
        "image_url":  "assets/images/shop/glass-pop-led-lights.jpg",
        "keywords":  "led lighting 18w 12w 6w 3w glass dimmable recessed pop led light electrical lighting 5548 7448",
        "in_stock":  true,
        "is_active":  true,
        "display_order":  4,
        "created_at":  "2026-11-04T22:14:46.23769+00:00",
        "updated_at":  "2026-11-04T22:14:46.23769+00:00"
    },
    {
        "id":  "4d73d6ec-c405-4eb7-8a34-deab2d7e62de",
        "name":  "Gooseneck Kitchen Sink Tap",
        "category":  "plumbing",
        "brand":  "Plumbing \u0026 Sanitary Ware",
        "badge":  "Plumbing · Kitchen Sink",
        "description":  "Durable white flexible gooseneck kitchen sink faucet with smooth rotary handle, precision aerator nozzle, and rust-proof standard threading.",
        "price":  4000,
        "price_max":  null,
        "price_display":  "₦4,000",
        "variants":  [

                     ],
        "images":  [
                       "assets/images/shop/kitchen-sink-tap.jpg"
                   ],
        "image_url":  "assets/images/shop/kitchen-sink-tap.jpg",
        "keywords":  "kitchen tap sink mixer faucet goose neck flexible white sanitary plumbing 4000",
        "in_stock":  true,
        "is_active":  true,
        "display_order":  5,
        "created_at":  "2026-11-04T22:14:46.23769+00:00",
        "updated_at":  "2026-11-04T22:14:46.23769+00:00"
    },
    {
        "id":  "0e8b16c6-fb2e-483c-a5e9-574686a332d9",
        "name":  "Dangote 3X Portland Cement (50kg)",
        "category":  "materials",
        "brand":  "Building Materials · Sourcing",
        "badge":  "50kg · Grade 42.5R",
        "description":  "Grade 42.5R Portland limestone cement. Xtra Strong, Xtra Life, Xtra Yield for robust structural casting, block-laying, and plastering.",
        "price":  14000,
        "price_max":  null,
        "price_display":  "₦14,000",
        "variants":  [

                     ],
        "images":  [
                       "assets/images/shop/dangote-cement-50kg.jpg"
                   ],
        "image_url":  "assets/images/shop/dangote-cement-50kg.jpg",
        "keywords":  "dangote cement 3x 50kg 42.5r portland limestone construction building materials 14000",
        "in_stock":  true,
        "is_active":  true,
        "display_order":  6,
        "created_at":  "2026-11-04T22:14:46.23769+00:00",
        "updated_at":  "2026-11-04T22:14:46.23769+00:00"
    },
    {
        "id":  "8332ab2b-2242-4522-8620-d1c54baa9991",
        "name":  "Inverter AC Gas R410A (Season)",
        "category":  "hvac",
        "brand":  "HVAC \u0026 Air Conditioning",
        "badge":  "Refrigerant · R410A",
        "description":  "High-purity R410A refrigerant gas for modern Inverter split and standing air conditioning systems. France specifications, non-flammable liquefied gas.",
        "price":  13000,
        "price_max":  null,
        "price_display":  "₦13,000",
        "variants":  [

                     ],
        "images":  [
                       "assets/images/shop/inverter-ac-gas-r410a.jpg"
                   ],
        "image_url":  "assets/images/shop/inverter-ac-gas-r410a.jpg",
        "keywords":  "inverter ac gas 410 r410a refrigerant season hvac air conditioning cylinder 13000",
        "in_stock":  true,
        "is_active":  true,
        "display_order":  7,
        "created_at":  "2026-11-04T22:14:46.23769+00:00",
        "updated_at":  "2026-11-04T22:14:46.23769+00:00"
    },
    {
        "id":  "55bc5fd0-bf95-4335-97e9-cd7ca60a7d97",
        "name":  "Soft-Close Cabinet Hinges (Pair)",
        "category":  "materials",
        "brand":  "Hardware \u0026 Cabinetry",
        "badge":  "Cabinet Hardware · Pair",
        "description":  "Hydraulic soft-close cabinet door hinges (inches). Silent damped closing mechanism, heavy-duty nickel plating, and 3D adjustable screws for kitchen and wardrobe doors.",
        "price":  1200,
        "price_max":  null,
        "price_display":  "₦1,200 / pair",
        "variants":  [

                     ],
        "images":  [
                       "assets/images/shop/soft-cabinet-hinges.jpg"
                   ],
        "image_url":  "assets/images/shop/soft-cabinet-hinges.jpg",
        "keywords":  "soft cabinet inches hinges pair hydraulic soft close stainless steel kitchen wardrobe 1200",
        "in_stock":  true,
        "is_active":  true,
        "display_order":  8,
        "created_at":  "2026-11-04T22:14:46.23769+00:00",
        "updated_at":  "2026-11-04T22:14:46.23769+00:00"
    },
    {
        "id":  "0653787c-0506-4b0e-a605-de832a9b927e",
        "name":  "Original AC Installation Kit (1HP)",
        "category":  "hvac",
        "brand":  "HVAC \u0026 Air Conditioning",
        "badge":  "Installation Kit · 1HP",
        "description":  "Complete split AC installation kit with pre-insulated pure copper connecting pipes, brass flare nuts, flexible drain hose, wrapping tape, and wall sealing cap.",
        "price":  20000,
        "price_max":  null,
        "price_display":  "₦20,000",
        "variants":  [

                     ],
        "images":  [
                       "assets/images/shop/original-ac-kit-1hp.jpg"
                   ],
        "image_url":  "assets/images/shop/original-ac-kit-1hp.jpg",
        "keywords":  "original ac kit 1hp copper pipe insulation drain hose tape air conditioner installation 20000",
        "in_stock":  true,
        "is_active":  true,
        "display_order":  9,
        "created_at":  "2026-11-04T22:14:46.23769+00:00",
        "updated_at":  "2026-11-04T22:14:46.23769+00:00"
    },
    {
        "id":  "3fcab1b8-5c59-4c53-b972-47256db6a22b",
        "name":  "AC Outdoor Unit Wall Hanger (1–2HP)",
        "category":  "hvac",
        "brand":  "HVAC \u0026 Air Conditioning",
        "badge":  "Hanger Bracket · 1–2HP",
        "description":  "Heavy-duty galvanized steel outdoor unit mounting bracket for 1HP – 2HP split ACs. Anti-vibration anchor holes, weather-resistant powder coating, and reinforced triangular load arms.",
        "price":  8000,
        "price_max":  null,
        "price_display":  "₦8,000",
        "variants":  [

                     ],
        "images":  [
                       "assets/images/shop/ac-outdoor-unit-hanger.jpg"
                   ],
        "image_url":  "assets/images/shop/ac-outdoor-unit-hanger.jpg",
        "keywords":  "aircondition outdoor unit hanger 1hp 2hp bracket wall mount condensing unit ac stand 8000",
        "in_stock":  true,
        "is_active":  true,
        "display_order":  10,
        "created_at":  "2026-11-04T22:14:46.23769+00:00",
        "updated_at":  "2026-11-04T22:14:46.23769+00:00"
    },
    {
        "id":  "4d24f7ba-856d-4bfd-acd3-bdc9d2400611",
        "name":  "MOREDAY 2-Pole DC Circuit Breaker",
        "category":  "lighting",
        "brand":  "Electrical \u0026 Solar Equipment",
        "badge":  "DC Breaker · 600V",
        "description":  "MOREDAY MDB1Z-63 2-Pole 600V DC miniature circuit breaker (MCB). Provides overload and short-circuit protection for solar PV arrays, inverters, and DC distribution boards.",
        "price":  15000,
        "price_max":  null,
        "price_display":  "₦15,000",
        "variants":  [

                     ],
        "images":  [
                       "assets/images/shop/moreday-dc-circuit-breaker.jpg"
                   ],
        "image_url":  "assets/images/shop/moreday-dc-circuit-breaker.jpg",
        "keywords":  "breaker moreday dc mcb circuit breaker 63a 600v solar inverter electrical distribution 15000",
        "in_stock":  true,
        "is_active":  true,
        "display_order":  11,
        "created_at":  "2026-11-04T22:14:46.23769+00:00",
        "updated_at":  "2026-11-04T22:14:46.23769+00:00"
    },
    {
        "id":  "b392e7ac-1cf7-4e68-8743-54a63ca2c075",
        "name":  "Universal Toilet Cistern Flush Handle",
        "category":  "plumbing",
        "brand":  "Plumbing \u0026 Sanitary Ware",
        "badge":  "Sanitary · Cistern Lever",
        "description":  "Chrome-plated universal toilet water tank flush lever handle. Heavy-duty adjustable multi-hole lift arm and corrosion-proof mounting locknut.",
        "price":  6000,
        "price_max":  null,
        "price_display":  "₦6,000",
        "variants":  [

                     ],
        "images":  [
                       "assets/images/shop/toilet-cistern-flush-handle.jpg"
                   ],
        "image_url":  "assets/images/shop/toilet-cistern-flush-handle.jpg",
        "keywords":  "toilet hand flusher flush handle cistern lever chrome bathroom sanitary 6000",
        "in_stock":  true,
        "is_active":  true,
        "display_order":  12,
        "created_at":  "2026-11-04T22:14:46.23769+00:00",
        "updated_at":  "2026-11-04T22:14:46.23769+00:00"
    },
    {
        "id":  "0d12e755-4808-4730-a8b6-48a7ff47a45d",
        "name":  "Brushed Grey Double Switched Socket",
        "category":  "lighting",
        "brand":  "Electrical \u0026 Lighting Fittings",
        "badge":  "Electrical · 13A Double",
        "description":  "Luxury brushed titanium grey 2-gang 13A switched electrical socket. Dual individual rocker switches with neon power indicators and child safety shutters.",
        "price":  3000,
        "price_max":  null,
        "price_display":  "₦3,000",
        "variants":  [

                     ],
        "images":  [
                       "assets/images/shop/brushed-grey-double-switch-socket.jpg"
                   ],
        "image_url":  "assets/images/shop/brushed-grey-double-switch-socket.jpg",
        "keywords":  "double switch switched socket 13a wall socket brushed grey neon electrical fittings 3000",
        "in_stock":  true,
        "is_active":  true,
        "display_order":  13,
        "created_at":  "2026-11-04T22:14:46.23769+00:00",
        "updated_at":  "2026-11-04T22:14:46.23769+00:00"
    },
    {
        "id":  "d01d53e8-1a6f-4d11-9e11-f518d8fc9e43",
        "name":  "Heavy-Duty 15A 3-Pin Plug Top",
        "category":  "lighting",
        "brand":  "Electrical \u0026 Lighting Fittings",
        "badge":  "Electrical · 15A Plug",
        "description":  "Heavy-duty 15A 250V round 3-pin plug top built to U.K. BS 546 standards. Solid brass pins, heat-resistant casing, and cord clamp for ACs and heavy appliances.",
        "price":  1500,
        "price_max":  null,
        "price_display":  "₦1,500",
        "variants":  [

                     ],
        "images":  [
                       "assets/images/shop/heavy-duty-15a-plug-top.jpg"
                   ],
        "image_url":  "assets/images/shop/heavy-duty-15a-plug-top.jpg",
        "keywords":  "plug 15a 3 pin round pin plug top bs 546 uk standard heavy duty electrical ac water heater 1500",
        "in_stock":  true,
        "is_active":  true,
        "display_order":  14,
        "created_at":  "2026-11-04T22:15:10.503474+00:00",
        "updated_at":  "2026-11-04T22:15:10.503474+00:00"
    },
    {
        "id":  "f8f8fc5a-ca0b-4ef0-8ebf-567302357e8e",
        "name":  "Complete Flowmaster Cistern Kit",
        "category":  "plumbing",
        "brand":  "Plumbing \u0026 Sanitary Ware",
        "badge":  "Plumbing · Full Kit",
        "description":  "Universal water tank repair and dual-flush conversion kit. Includes height-adjustable bottom-entry inlet fill valve (flowmaster), siphon flush valve, chrome dual push button, and mounting bolts.",
        "price":  10000,
        "price_max":  null,
        "price_display":  "₦10,000",
        "variants":  [

                     ],
        "images":  [
                       "assets/images/shop/complete-flowmaster-cistern-kit.jpg"
                   ],
        "image_url":  "assets/images/shop/complete-flowmaster-cistern-kit.jpg",
        "keywords":  "complete flow master flowmaster toilet cistern dual flush valve bottom entry fill valve bathroom sanitary 10000",
        "in_stock":  true,
        "is_active":  true,
        "display_order":  15,
        "created_at":  "2026-11-04T22:15:10.503474+00:00",
        "updated_at":  "2026-11-04T22:15:10.503474+00:00"
    },
    {
        "id":  "6c328e2b-9ecb-45ea-8fb3-fb6673048e26",
        "name":  "1.5HP Inverter AC Copper Pipe Kit",
        "category":  "hvac",
        "brand":  "HVAC \u0026 Air Conditioning",
        "badge":  "HVAC · 1.5HP Copper",
        "description":  "1.5HP Inverter air conditioner pure copper pipe installation set. Fitted with brass flare nuts, brass unions, high-pressure fittings, and sealing accessories.",
        "price":  30000,
        "price_max":  null,
        "price_display":  "₦30,000",
        "variants":  [

                     ],
        "images":  [
                       "assets/images/shop/inverter-ac-copper-pipe-kit-1-5hp.jpg"
                   ],
        "image_url":  "assets/images/shop/inverter-ac-copper-pipe-kit-1-5hp.jpg",
        "keywords":  "ac pipe 1.5hp inverter copper pipe kit flare nut carrier split air conditioner installation 30000",
        "in_stock":  true,
        "is_active":  true,
        "display_order":  16,
        "created_at":  "2026-11-04T22:15:10.503474+00:00",
        "updated_at":  "2026-11-04T22:15:10.503474+00:00"
    },
    {
        "id":  "e7e7a2c8-41c6-459c-98fc-a928bfe57b1b",
        "name":  "Flexible Magic Waste with Pop-Up Drain",
        "category":  "plumbing",
        "brand":  "Plumbing \u0026 Sanitary Ware",
        "badge":  "Plumbing · Magic Waste",
        "description":  "Universal expandable flexible magic waste pipe with stainless steel pop-up bounce core stopper. Odor-resistant bendable corrugated P-trap for washbasins and sinks.",
        "price":  5000,
        "price_max":  null,
        "price_display":  "₦5,000",
        "variants":  [

                     ],
        "images":  [
                       "assets/images/shop/flexible-magic-waste-pipe.jpg"
                   ],
        "image_url":  "assets/images/shop/flexible-magic-waste-pipe.jpg",
        "keywords":  "magic waste flexible pipe pop up drain basin sink p trap connector bathroom sanitary 5000",
        "in_stock":  true,
        "is_active":  true,
        "display_order":  17,
        "created_at":  "2026-11-04T22:15:10.503474+00:00",
        "updated_at":  "2026-11-04T22:15:10.503474+00:00"
    },
    {
        "id":  "e42fb10c-fa6e-4398-a2df-5931a0477262",
        "name":  "Wall-Mount Bath \u0026 Shower Mixer Tap",
        "category":  "plumbing",
        "brand":  "Plumbing \u0026 Sanitary Ware",
        "badge":  "Plumbing · Hot \u0026 Cold",
        "description":  "Heavy solid brass chrome-finished wall bathtub and shower mixer faucet. Smooth single-lever hot/cold water control, pull-up shower diverter knob, and 1/2\" wall fittings.",
        "price":  28000,
        "price_max":  null,
        "price_display":  "₦28,000",
        "variants":  [

                     ],
        "images":  [
                       "assets/images/shop/wall-mount-shower-mixer-tap.jpg"
                   ],
        "image_url":  "assets/images/shop/wall-mount-shower-mixer-tap.jpg",
        "keywords":  "shower mixer tap bath wall mount hot cold water diverter brass chrome bathroom sanitary 28000",
        "in_stock":  true,
        "is_active":  true,
        "display_order":  18,
        "created_at":  "2026-11-04T22:15:10.503474+00:00",
        "updated_at":  "2026-11-04T22:15:10.503474+00:00"
    },
    {
        "id":  "97bac814-594b-4954-9300-7b0ab81dfa33",
        "name":  "Heavy-Duty Brass Lever Bibcock Tap",
        "category":  "plumbing",
        "brand":  "Plumbing \u0026 Sanitary Ware",
        "badge":  "Plumbing · Brass Tap",
        "description":  "Solid brass nickel-plated quarter-turn ball tap. Features blue vinyl lever handle, standard 1/2\" wall thread, and detachable ribbed hose pipe connector nozzle.",
        "price":  2500,
        "price_max":  null,
        "price_display":  "₦2,500",
        "variants":  [

                     ],
        "images":  [
                       "assets/images/shop/brass-lever-bibcock-tap.jpg"
                   ],
        "image_url":  "assets/images/shop/brass-lever-bibcock-tap.jpg",
        "keywords":  "tap bibcock brass lever tap garden outdoor washing machine hose nozzle plumbing 2500",
        "in_stock":  true,
        "is_active":  true,
        "display_order":  19,
        "created_at":  "2026-11-04T22:15:10.503474+00:00",
        "updated_at":  "2026-11-04T22:15:10.503474+00:00"
    },
    {
        "id":  "80fd64c2-af15-4080-9794-57c34c582ac2",
        "name":  "45A Cooker Control Unit with 13A Socket",
        "category":  "lighting",
        "brand":  "Electrical \u0026 Lighting Fittings",
        "badge":  "Electrical · 45A Cooker",
        "description":  "Heavy-duty 45A kitchen cooker switch with integrated 13A switched socket outlet. Dual red neon indicators, independent double pole switches, and heat-resistant fascia.",
        "price":  18000,
        "price_max":  null,
        "price_display":  "₦18,000",
        "variants":  [

                     ],
        "images":  [
                       "assets/images/shop/cooker-control-unit-socket.jpg"
                   ],
        "image_url":  "assets/images/shop/cooker-control-unit-socket.jpg",
        "keywords":  "cooker socket 45a cooker control unit 13a switched socket dual switch neon electrical kitchen appliance 18000",
        "in_stock":  true,
        "is_active":  true,
        "display_order":  20,
        "created_at":  "2026-11-04T22:15:10.503474+00:00",
        "updated_at":  "2026-11-04T22:15:10.503474+00:00"
    },
    {
        "id":  "fc2eed3e-c314-458c-90eb-5bb6ff583161",
        "name":  "Single Switched Socket Outlet (13A)",
        "category":  "lighting",
        "brand":  "Electrical \u0026 Lighting Fittings",
        "badge":  "Electrical · Socket Outlet",
        "description":  "Durable white single gang switched socket with integrated rocker on/off switch and red neon power indicator. Universal pin configuration with internal safety shutter.",
        "price":  1800,
        "price_max":  null,
        "price_display":  "₦1,800",
        "variants":  [

                     ],
        "images":  [
                       "assets/images/shop/single-switched-socket-white.jpg"
                   ],
        "image_url":  "assets/images/shop/single-switched-socket-white.jpg",
        "keywords":  "single switch single switched socket outlet 13a wall switch socket white electrical fittings 1800",
        "in_stock":  true,
        "is_active":  true,
        "display_order":  21,
        "created_at":  "2026-11-04T22:15:10.503474+00:00",
        "updated_at":  "2026-11-04T22:15:10.503474+00:00"
    },
    {
        "id":  "f9654956-4dc8-4b26-b2cb-62de1d5a9e27",
        "name":  "Arctic R410A Refrigerant Gas (1000g / 1kg)",
        "category":  "hvac",
        "brand":  "HVAC \u0026 AC Supplies",
        "badge":  "HVAC · R410A 1kg",
        "description":  "Genuine Arctic R410A inverter refrigerant gas canister (Lobocool International). Designed to restore lost cooling capacity, protect inverter compressors, and prevent contamination.",
        "price":  16000,
        "price_max":  null,
        "price_display":  "₦16,000",
        "variants":  [

                     ],
        "images":  [
                       "assets/images/shop/arctic-r410a-refrigerant-gas-1kg.jpg"
                   ],
        "image_url":  "assets/images/shop/arctic-r410a-refrigerant-gas-1kg.jpg",
        "keywords":  "r410a ac gas refrigerant arctic lobocool inverter gas 1000g 1kg canister air conditioner hvac cooling 16000",
        "in_stock":  true,
        "is_active":  true,
        "display_order":  22,
        "created_at":  "2026-11-04T22:15:10.503474+00:00",
        "updated_at":  "2026-11-04T22:15:10.503474+00:00"
    },
    {
        "id":  "5e6ce1cc-3e91-45bd-81e1-39d0fe78be80",
        "name":  "Round Surface-Mount LED Panel Light",
        "category":  "lighting",
        "brand":  "Electrical \u0026 Lighting Fittings",
        "badge":  "Electrical · Surface LED",
        "description":  "Ultra-slim circular surface-mounted LED ceiling panel light. Designed with energy-efficient driver, frosted anti-glare diffuser, and durable white aluminum rim. Mounts directly without ceiling cutouts.",
        "price":  3000,
        "price_max":  null,
        "price_display":  "₦3,000",
        "variants":  [

                     ],
        "images":  [
                       "assets/images/shop/round-surface-mount-led-panel-light.jpg"
                   ],
        "image_url":  "assets/images/shop/round-surface-mount-led-panel-light.jpg",
        "keywords":  "led panel light round surface mount ceiling light downlight circular white pop light lighting 3000",
        "in_stock":  true,
        "is_active":  true,
        "display_order":  23,
        "created_at":  "2026-11-04T22:15:10.503474+00:00",
        "updated_at":  "2026-11-04T22:15:10.503474+00:00"
    },
    {
        "id":  "acfe6bcd-6a56-4573-8369-57a2a512bb30",
        "name":  "3-Head Matte Black Ceiling Spotlight Fitting",
        "category":  "lighting",
        "brand":  "Electrical \u0026 Lighting Fittings",
        "badge":  "Electrical · 3-Head Spotlight",
        "description":  "Contemporary 3-way directional ceiling spotlight bar in sleek matte black finish. Features fully rotatable and tiltable cylinder lamp heads for precision accent, living room, and architectural lighting.",
        "price":  38000,
        "price_max":  null,
        "price_display":  "₦38,000",
        "variants":  [

                     ],
        "images":  [
                       "assets/images/shop/3-head-black-track-spotlight.jpg"
                   ],
        "image_url":  "assets/images/shop/3-head-black-track-spotlight.jpg",
        "keywords":  "3 head spotlight black track light spotlight ceiling adjustable swivel directional warm light lighting 38000",
        "in_stock":  true,
        "is_active":  true,
        "display_order":  24,
        "created_at":  "2026-11-04T22:15:10.503474+00:00",
        "updated_at":  "2026-11-04T22:15:10.503474+00:00"
    },
    {
        "id":  "a9392716-ab5c-48d0-b354-ab119d2aca86",
        "name":  "24V Flexible LED Strip Light Roll (32.8ft / 10m)",
        "category":  "lighting",
        "brand":  "Electrical \u0026 Lighting Fittings",
        "badge":  "Electrical · 24V Strip Roll",
        "description":  "High-density 24V DC flexible LED strip tape light in vivid ambient ice-blue. Continuous 32.8ft (10m) roll on spool with self-adhesive backing, low-voltage safety, and smooth uniform illumination for POP coves and accent lighting.",
        "price":  16000,
        "price_max":  null,
        "price_display":  "₦16,000",
        "variants":  [

                     ],
        "images":  [
                       "assets/images/shop/flexible-led-strip-light-roll-24v.jpg"
                   ],
        "image_url":  "assets/images/shop/flexible-led-strip-light-roll-24v.jpg",
        "keywords":  "led strip light 24v 32.8ft 10m roll rope light tape light neon blue cove light pop ceiling lighting 16000",
        "in_stock":  true,
        "is_active":  true,
        "display_order":  25,
        "created_at":  "2026-11-04T22:15:10.503474+00:00",
        "updated_at":  "2026-11-04T22:15:10.503474+00:00"
    },
    {
        "id":  "eb85de01-3e4f-446f-a41b-71df67a301de",
        "name":  "Nijedee wall plaster Filers",
        "category":  "paints",
        "brand":  "Nijedee wall plaster fillers",
        "badge":  "Fillers",
        "description":  "water proof interior / Exterior use",
        "price":  2000,
        "price_max":  null,
        "price_display":  "₦2,000",
        "variants":  [

                     ],
        "images":  [
                       "https://xgdwxuraupeztihfugxb.supabase.co/storage/v1/object/public/request-attachments/products/1794056046348_5mbj6_image.jpg"
                   ],
        "image_url":  "https://xgdwxuraupeztihfugxb.supabase.co/storage/v1/object/public/request-attachments/products/1794056046348_5mbj6_image.jpg",
        "keywords":  "Pop fillers",
        "in_stock":  true,
        "is_active":  true,
        "display_order":  26,
        "created_at":  "2026-11-07T12:55:45.836+00:00",
        "updated_at":  "2026-11-07T12:55:45.836+00:00"
    },
    {
        "id":  "76aed9be-6a0a-498e-a752-7cd9dfb1853e",
        "name":  "LED color bulb",
        "category":  "lighting",
        "brand":  "Led bulb",
        "badge":  "",
        "description":  "kmpbt led bulb",
        "price":  500,
        "price_max":  null,
        "price_display":  "₦500",
        "variants":  [

                     ],
        "images":  [
                       "https://xgdwxuraupeztihfugxb.supabase.co/storage/v1/object/public/request-attachments/products/1794056526322_zswsx_image.jpg"
                   ],
        "image_url":  "https://xgdwxuraupeztihfugxb.supabase.co/storage/v1/object/public/request-attachments/products/1794056526322_zswsx_image.jpg",
        "keywords":  "Bulb",
        "in_stock":  true,
        "is_active":  true,
        "display_order":  27,
        "created_at":  "2026-11-07T13:03:08.495+00:00",
        "updated_at":  "2026-11-07T13:03:08.495+00:00"
    },
    {
        "id":  "8d8c2801-de9d-4d3c-86e3-a6265a065e94",
        "name":  "Float switch",
        "category":  "paints",
        "brand":  "Floating switch minamatic",
        "badge":  "",
        "description":  "Matic SAL Italy float switch",
        "price":  7000,
        "price_max":  null,
        "price_display":  "₦7,000",
        "variants":  [

                     ],
        "images":  [
                       "https://xgdwxuraupeztihfugxb.supabase.co/storage/v1/object/public/request-attachments/products/1794056710908_kkpfk_IMG_8324.jpg",
                       "https://xgdwxuraupeztihfugxb.supabase.co/storage/v1/object/public/request-attachments/products/1794056712131_6945o_IMG_8325.jpg"
                   ],
        "image_url":  "https://xgdwxuraupeztihfugxb.supabase.co/storage/v1/object/public/request-attachments/products/1794056710908_kkpfk_IMG_8324.jpg",
        "keywords":  "",
        "in_stock":  true,
        "is_active":  true,
        "display_order":  28,
        "created_at":  "2026-11-07T13:09:31.937+00:00",
        "updated_at":  "2026-11-07T13:10:16.496+00:00"
    }
];

  // Seed Properties (4 Verified Real Estate Listings)
  const NIJEDEE_INITIAL_PROPERTIES = [
    {
        "id":  "a21e7ba3-ef75-44ec-bad3-105319dc7eec",
        "title":  "Self-Contain Apartment",
        "category":  "rent",
        "badge":  "For Rent",
        "location":  "Badore, Ajah",
        "address":  "Badore, Ajah",
        "ref_code":  "NJD-PROP-01",
        "price":  950000,
        "price_period":  "year",
        "price_display":  "₦950,000 / year",
        "status_tag":  "Verified Direct",
        "description":  "Spacious, well-ventilated self-contained apartment with all-round polished marble-style vitrified tiles, modern POP ceiling design with recessed spotlighting, dual aluminum sliding windows, and private en-suite bath.",
        "fee_breakdown":  {
                              "rent":  950000,
                              "total_package":  950000
                          },
        "features":  [
                         "POP Ceiling",
                         "Vitrified Tiles",
                         "En-Suite Bath",
                         "Gated Compound"
                     ],
        "images":  [
                       "assets/images/properties/self-contain-badore-ajah.jpg"
                   ],
        "image_url":  "assets/images/properties/self-contain-badore-ajah.jpg",
        "whatsapp_msg":  "Hello NIJEDEE Properties, I want to inspect the Self-Contain in Badore Ajah (NGN 950,000/year)",
        "is_available":  true,
        "is_active":  true,
        "display_order":  1,
        "created_at":  "2026-11-04T22:15:30.171451+00:00",
        "updated_at":  "2026-11-04T22:15:30.171451+00:00"
    },
    {
        "id":  "b2aaedf3-bdfd-4253-8ff3-082f6b59182f",
        "title":  "Single Room Furnished Shortlet",
        "category":  "shortlet",
        "badge":  "Shortlet",
        "location":  "Badore, Ajah",
        "address":  "Badore, Ajah",
        "ref_code":  "NJD-PROP-02",
        "price":  170000,
        "price_period":  "stay",
        "price_display":  "₦170,000",
        "status_tag":  "Furnished Stay",
        "description":  "Comfortable, private furnished single room for short-stay guests, work visits, and budget retreats. Includes comfortable bed, wardrobe, standing fan, mounted television, curtains, and clean tiled flooring.",
        "fee_breakdown":  {
                              "rent":  170000,
                              "total_package":  170000
                          },
        "features":  [
                         "Bed \u0026 Wardrobe",
                         "Television \u0026 Fan",
                         "Tiled Floor",
                         "Private Entry"
                     ],
        "images":  [
                       "assets/images/properties/shortlet-single-room-badore.jpg"
                   ],
        "image_url":  "assets/images/properties/shortlet-single-room-badore.jpg",
        "whatsapp_msg":  "Hello NIJEDEE Properties, I want to book the Single Room Shortlet in Badore Ajah (NGN 170,000)",
        "is_available":  true,
        "is_active":  true,
        "display_order":  2,
        "created_at":  "2026-11-04T22:15:30.171451+00:00",
        "updated_at":  "2026-11-04T22:15:30.171451+00:00"
    },
    {
        "id":  "097fd101-e24a-4b2a-ad94-01cfe3bd091c",
        "title":  "Shared Apartment · Ground Floor",
        "category":  "rent",
        "badge":  "For Rent · Downstairs",
        "location":  "Badore, Ajah",
        "address":  "Goodness Estate (Remlek Bus Stop), Badore, Ajah",
        "ref_code":  "Nf0926",
        "price":  800000,
        "price_period":  "year",
        "price_display":  "₦800,000 / year",
        "status_tag":  "Pay \u0026 Move In ASAP",
        "description":  "Spacious ground-floor shared apartment featuring private en-suite bedroom with fitted wardrobes, access to an expansive general parlor and lounge with POP ceiling, fitted kitchen with cabinetry, and bathroom with bathtub and water heater.",
        "fee_breakdown":  {
                              "rent":  800000,
                              "legal":  80000,
                              "agency":  80000,
                              "caution":  150000,
                              "total_package":  1260000,
                              "service_charge":  150000
                          },
        "features":  [
                         "General Lounge",
                         "Bathtub \u0026 Water Heater",
                         "Fitted Wardrobe",
                         "Fitted Kitchen",
                         "Gated Estate"
                     ],
        "images":  [
                       "assets/images/properties/shared-apt-goodness-estate-exterior.jpg",
                       "assets/images/properties/shared-apt-goodness-estate-lounge.jpg",
                       "assets/images/properties/shared-apt-goodness-estate-bedroom.jpg",
                       "assets/images/properties/shared-apt-goodness-estate-kitchen.jpg",
                       "assets/images/properties/shared-apt-goodness-estate-bathroom.jpg"
                   ],
        "image_url":  "assets/images/properties/shared-apt-goodness-estate-exterior.jpg",
        "whatsapp_msg":  "Hello NIJEDEE Properties, I want to inspect the Shared Apartment in Goodness Estate Badore (Ref: Nf0926, Rent: NGN 800,000)",
        "is_available":  true,
        "is_active":  true,
        "display_order":  3,
        "created_at":  "2026-11-04T22:15:30.171451+00:00",
        "updated_at":  "2026-11-04T22:15:30.171451+00:00"
    },
    {
        "id":  "91aa6ca9-f839-4f13-8e7d-cd26ad737d2d",
        "title":  "Executive Mini Flat (1-Bedroom)",
        "category":  "rent",
        "badge":  "For Rent · Mini Flat",
        "location":  "Badore, Ajah",
        "address":  "Mega Estate, Badore, Ajah",
        "ref_code":  "MEGA-01",
        "price":  1400000,
        "price_period":  "year",
        "price_display":  "₦1,400,000 / year",
        "status_tag":  "Stone Throw from Gate",
        "description":  "Neat, well-finished 1-bedroom mini flat situated in prime Mega Estate just a stone\u0027s throw from the main estate gate. Features private parlor, en-suite bedroom, fitted kitchen, dedicated prepaid meter, and no monthly service charges.",
        "fee_breakdown":  {
                              "rent":  1400000,
                              "legal":  140000,
                              "agency":  300000,
                              "caution":  140000,
                              "total_package":  1980000,
                              "service_charge":  0
                          },
        "features":  [
                         "Personal Prepaid Meter",
                         "Gate-Side Location",
                         "1 Bed + Parlor",
                         "Private Kitchen \u0026 Bath",
                         "Zero Service Charge"
                     ],
        "images":  [
                       "assets/images/properties/mega-estate-miniflat/mega-estate-miniflat-01.jpg",
                       "assets/images/properties/mega-estate-miniflat/mega-estate-miniflat-02.jpg",
                       "assets/images/properties/mega-estate-miniflat/mega-estate-miniflat-03.jpg",
                       "assets/images/properties/mega-estate-miniflat/mega-estate-miniflat-04.jpg",
                       "assets/images/properties/mega-estate-miniflat/mega-estate-miniflat-05.jpg",
                       "assets/images/properties/mega-estate-miniflat/mega-estate-miniflat-06.jpg",
                       "assets/images/properties/mega-estate-miniflat/mega-estate-miniflat-07.jpg",
                       "assets/images/properties/mega-estate-miniflat/mega-estate-miniflat-08.jpg",
                       "assets/images/properties/mega-estate-miniflat/mega-estate-miniflat-09.jpg",
                       "assets/images/properties/mega-estate-miniflat/mega-estate-miniflat-10.jpg",
                       "assets/images/properties/mega-estate-miniflat/mega-estate-miniflat-11.jpg",
                       "assets/images/properties/mega-estate-miniflat/mega-estate-miniflat-12.jpg",
                       "assets/images/properties/mega-estate-miniflat/mega-estate-miniflat-13.jpg"
                   ],
        "image_url":  "assets/images/properties/mega-estate-miniflat/mega-estate-miniflat-01.jpg",
        "whatsapp_msg":  "Hello NIJEDEE Properties, I want to inspect the Mini Flat in Mega Estate Badore (Rent: NGN 1,400,000/year)",
        "is_available":  true,
        "is_active":  true,
        "display_order":  4,
        "created_at":  "2026-11-04T22:15:30.171451+00:00",
        "updated_at":  "2026-11-04T22:15:30.171451+00:00"
    }
];

  const CACHE_KEY_PRODUCTS = 'nijedee_cached_products_v2';
  const CACHE_KEY_PROPERTIES = 'nijedee_cached_properties_v2';

  /**
   * Retrieve cached products synchronously for 0ms first-paint
   */
  function getStoredProducts() {
    try {
      const stored = localStorage.getItem(CACHE_KEY_PRODUCTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading stored products:', e);
    }
    return NIJEDEE_INITIAL_PRODUCTS;
  }

  /**
   * Persist fresh products to local cache
   */
  function saveStoredProducts(products) {
    if (!Array.isArray(products) || products.length === 0) return;
    try {
      localStorage.setItem(CACHE_KEY_PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.warn('Error saving stored products:', e);
    }
  }

  /**
   * Retrieve cached properties synchronously for 0ms first-paint
   */
  function getStoredProperties() {
    try {
      const stored = localStorage.getItem(CACHE_KEY_PROPERTIES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading stored properties:', e);
    }
    return NIJEDEE_INITIAL_PROPERTIES;
  }

  /**
   * Persist fresh properties to local cache
   */
  function saveStoredProperties(properties) {
    if (!Array.isArray(properties) || properties.length === 0) return;
    try {
      localStorage.setItem(CACHE_KEY_PROPERTIES, JSON.stringify(properties));
    } catch (e) {
      console.warn('Error saving stored properties:', e);
    }
  }

  /**
   * Fast Direct REST fetch from Supabase with timeout safeguard
   */
  async function fetchLiveProductsDirect(timeoutMs = 6000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const url = 'https://xgdwxuraupeztihfugxb.supabase.co/rest/v1/products?select=*&is_active=eq.true&order=display_order.asc,created_at.desc';
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZHd4dXJhdXBlenRpaGZ1Z3hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3MDM1NDAsImV4cCI6MjEwOTI3OTU0MH0.0caOjkT0es74sh2qs9bx-y2jX8DIsM0MH1ZOflW4irk';

    try {
      const resp = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
          'Authorization': 'Bearer ' + apiKey,
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      clearTimeout(timer);

      if (!resp.ok) {
        throw new Error('Supabase responded with status: ' + resp.status);
      }

      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        saveStoredProducts(data);
        return data;
      }
    } catch (err) {
      clearTimeout(timer);
      console.warn('Direct fetch products notice:', err.message);
    }
    return null;
  }

  /**
   * Fast Direct REST fetch from Supabase for properties with timeout safeguard
   */
  async function fetchLivePropertiesDirect(timeoutMs = 6000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const url = 'https://xgdwxuraupeztihfugxb.supabase.co/rest/v1/properties?select=*&is_active=eq.true&order=created_at.desc';
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZHd4dXJhdXBlenRpaGZ1Z3hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3MDM1NDAsImV4cCI6MjEwOTI3OTU0MH0.0caOjkT0es74sh2qs9bx-y2jX8DIsM0MH1ZOflW4irk';

    try {
      const resp = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
          'Authorization': 'Bearer ' + apiKey,
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      clearTimeout(timer);

      if (!resp.ok) {
        throw new Error('Supabase responded with status: ' + resp.status);
      }

      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        saveStoredProperties(data);
        return data;
      }
    } catch (err) {
      clearTimeout(timer);
      console.warn('Direct fetch properties notice:', err.message);
    }
    return null;
  }

  // Expose API globally
  window.NijedeeCatalog = {
    getStoredProducts,
    saveStoredProducts,
    getStoredProperties,
    saveStoredProperties,
    fetchLiveProductsDirect,
    fetchLivePropertiesDirect,
    INITIAL_PRODUCTS: NIJEDEE_INITIAL_PRODUCTS,
    INITIAL_PROPERTIES: NIJEDEE_INITIAL_PROPERTIES
  };

})(window);