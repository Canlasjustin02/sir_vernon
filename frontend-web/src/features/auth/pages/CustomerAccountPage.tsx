import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { MapPin, Phone, Mail, Store, Search, Star, Navigation, Filter, X } from "lucide-react";
import AuthCard from "../components/AuthCard";
import { authApi } from "../api/auth.api";
import { tokenStorage } from "../../../services/storage/tokenStorage";
import { userStorage } from "../../../services/storage/userStorage";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { logout } from "../../../store/slices/auth.slice";
import { getUsers } from "../../../features/users/api/user.api";
import type { User } from "../../../features/users/types";
import { servicesApi } from "../../../features/services/api/services.api";
import type { LaundryService } from "../../../features/services/types";
import { createCustomerOrder } from "../../../features/orders/api/orders.api";

type ShopWithMeta = User & {
  area: string;
  distanceKm: number;
  rating: number;
};

const getAreaFromAddress = (address?: string) => {
  if (!address) return "Unknown";

  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return parts[parts.length - 1] || "Unknown";
};

const getDistanceKm = (shop: User) => {
  const seed = shop.name
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0) + shop.telephone.length * 7;

  return Number(((seed % 16) + 3).toFixed(1));
};

const getRating = (shop: User) => {
  const seed = shop.name
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0) + shop.email.length;

  return 3.5 + (seed % 10) / 10;
};

export default function CustomerAccountPage() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [shops, setShops] = useState<ShopWithMeta[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedArea, setSelectedArea] = useState("All areas");
  const [maxDistance, setMaxDistance] = useState(20);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [bookingShop, setBookingShop] = useState<ShopWithMeta | null>(null);
  const [services, setServices] = useState<LaundryService[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [serviceId, setServiceId] = useState("");
  const [weightKg, setWeightKg] = useState("1");
  const [reservedDateTime, setReservedDateTime] = useState("");
  const [bookingAddress, setBookingAddress] = useState(user?.address ?? "");
  const [bookingNotes, setBookingNotes] = useState("");

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const admins = await getUsers("ADMIN");
        const mapped = admins
          .filter((shop) => shop.isActive)
          .map((shop) => ({
            ...shop,
            area: getAreaFromAddress(shop.address),
            distanceKm: getDistanceKm(shop),
            rating: Number(getRating(shop).toFixed(1)),
          }));

        setShops(mapped);
        if (mapped[0]) setSelectedShopId(mapped[0]._id);
      } catch (error) {
        console.error("Failed to fetch available shops", error);
        setShops([]);
      } finally {
        setLoadingShops(false);
      }
    };

    fetchShops();
  }, []);

  const areaOptions = useMemo(
    () => ["All areas", ...new Set(shops.map((shop) => shop.area))],
    [shops]
  );

  const filteredShops = useMemo(() => {
    const query = search.trim().toLowerCase();

    return shops.filter((shop) => {
      const matchesQuery =
        !query ||
        shop.name.toLowerCase().includes(query) ||
        shop.address?.toLowerCase().includes(query) ||
        shop.area.toLowerCase().includes(query);

      const matchesArea = selectedArea === "All areas" || shop.area === selectedArea;
      const matchesDistance = shop.distanceKm <= maxDistance;

      return matchesQuery && matchesArea && matchesDistance;
    });
  }, [shops, search, selectedArea, maxDistance]);

  useEffect(() => {
    if (!filteredShops.length) {
      setSelectedShopId(null);
      return;
    }

    const selectedExists = filteredShops.some((shop) => shop._id === selectedShopId);
    if (!selectedExists) {
      setSelectedShopId(filteredShops[0]._id);
    }
  }, [filteredShops, selectedShopId]);

  const selectedShop = filteredShops.find((shop) => shop._id === selectedShopId) ?? filteredShops[0] ?? null;

  const signOut = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Customer logout request failed", error);
    } finally {
      tokenStorage.clear();
      userStorage.clear();
      dispatch(logout());
      toast.success("You have signed out.");
      navigate("/customer/login", { replace: true });
    }
  };

  const openBooking = async (shop: ShopWithMeta) => {
    setBookingShop(shop);
    setBookingAddress(user?.address ?? "");
    setReservedDateTime("");
    setBookingNotes("");
    setLoadingServices(true);
    try {
      const response = await servicesApi.getAll({ page: 1, limit: 100, isActive: true });
      const availableServices = response.items.filter((service) => service.isActive !== false);
      setServices(availableServices);
      setServiceId(availableServices[0]?._id ?? "");
    } catch (error) {
      console.error("Failed to fetch booking services", error);
      toast.error("Could not load laundry services");
      setBookingShop(null);
    } finally {
      setLoadingServices(false);
    }
  };

  const submitBooking = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!bookingShop || !serviceId) return;

    setSubmittingBooking(true);
    try {
      const order = await createCustomerOrder({
        serviceId,
        shopOwnerId: bookingShop._id,
        weightKg: Number(weightKg),
        reservedDateTime: new Date(reservedDateTime).toISOString(),
        pickupAddress: bookingAddress.trim(),
        deliveryAddress: bookingAddress.trim(),
        notes: bookingNotes.trim() || undefined,
        paymentMethod: "COD",
      });
      setBookingShop(null);
      toast.success(`Booking ${order.orderNo} sent to ${bookingShop.name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not place booking");
    } finally {
      setSubmittingBooking(false);
    }
  };

  return (
    <div className="space-y-6">
      <AuthCard title="Your account" subtitle="You are signed in to your customer account.">
        <div className="space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
          <p><span className="font-medium text-slate-500">Name</span><br />{user?.name}</p>
          <p><span className="font-medium text-slate-500">Email</span><br />{user?.email}</p>
          <p><span className="font-medium text-slate-500">Phone</span><br />{user?.telephone}</p>
        </div>
        <button onClick={signOut} className="mt-5 h-12 w-full rounded-lg bg-slate-900 font-semibold text-white hover:bg-slate-800">
          Sign out
        </button>
      </AuthCard>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.12em] text-slate-500">Shop discovery</p>
            <h2 className="text-2xl font-bold text-slate-900">Available laundry shops</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="relative block min-w-55">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by shop or area"
                className="h-11 w-full rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <Filter size={16} className="text-slate-500" />
              <select
                value={selectedArea}
                onChange={(event) => setSelectedArea(event.target.value)}
                className="bg-transparent outline-none"
              >
                {areaOptions.map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <Navigation size={16} className="text-blue-600" />
              Distance filter
            </div>
            <span className="text-sm font-semibold text-slate-800">Up to {maxDistance} km</span>
          </div>
          <input
            type="range"
            min="2"
            max="30"
            step="1"
            value={maxDistance}
            onChange={(event) => setMaxDistance(Number(event.target.value))}
            className="h-2 w-full accent-blue-600"
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="relative h-52 overflow-hidden rounded-2xl border border-slate-200 bg-linear-to-br from-sky-100 via-slate-100 to-emerald-100">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.18),transparent_22%),radial-gradient(circle_at_60%_65%,rgba(16,185,129,0.18),transparent_25%)]" />
              {filteredShops.slice(0, 5).map((shop, index) => (
                <button
                  key={shop._id}
                  type="button"
                  onClick={() => setSelectedShopId(shop._id)}
                  className="absolute flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-[10px] font-bold text-white shadow-lg transition hover:scale-105"
                  style={{
                    left: `${12 + index * 18}%`,
                    top: `${20 + (index % 3) * 22}%`,
                  }}
                  title={shop.name}
                >
                  {shop.name.slice(0, 2).toUpperCase()}
                </button>
              ))}
              <div className="absolute bottom-3 left-3 rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
                {filteredShops.length} shops nearby
              </div>
            </div>

            {loadingShops ? (
              <p className="text-sm text-slate-500">Loading available shops...</p>
            ) : filteredShops.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                No shops match your filters</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredShops.map((shop) => (
                  <button
                    key={shop._id}
                    type="button"
                    onClick={() => setSelectedShopId(shop._id)}
                    className={`text-left rounded-xl border p-4 transition ${
                      selectedShop?._id === shop._id
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                          <Store size={18} />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-slate-900">{shop.name}</h3>
                          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{shop.area}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-blue-700">{shop.distanceKm} km</span>
                    </div>

                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(5)].map((_, index) => (
                        <Star
                          key={index}
                          size={14}
                          fill={index < Math.round(shop.rating) ? "currentColor" : "none"}
                        />
                      ))}
                      <span className="ml-1 text-xs font-medium text-slate-600">{shop.rating}</span>
                    </div>

                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      <div className="flex items-start gap-2">
                        <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />
                        <span>{shop.address || "Address not provided"}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {selectedShop ? (
              <>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Selected shop</p>
                    <h3 className="text-2xl font-bold text-slate-900">{selectedShop.name}</h3>
                  </div>
                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    {selectedShop.distanceKm} km away
                  </span>
                </div>

                <div className="mb-4 flex items-center gap-2 text-amber-500">
                  {[...Array(5)].map((_, index) => (
                    <Star
                      key={index}
                      size={18}
                      fill={index < Math.round(selectedShop.rating) ? "currentColor" : "none"}
                    />
                  ))}
                  <span className="text-sm font-semibold text-slate-700">{selectedShop.rating} rating</span>
                </div>

                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="mt-0.5 text-slate-400" />
                    <span>{selectedShop.address || "Address not provided"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-slate-400" />
                    <span>{selectedShop.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-slate-400" />
                    <span>{selectedShop.telephone}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void openBooking(selectedShop)}
                  className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Book This Laundry Shop
                </button>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                Select a shop to see details.
              </div>
            )}
          </div>
        </div>
      </div>

      {bookingShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">New booking</p>
                <h2 id="booking-title" className="mt-1 text-xl font-bold text-slate-900">{bookingShop.name}</h2>
                <p className="mt-1 text-sm text-slate-500">Your request will appear as pending for this shop.</p>
              </div>
              <button
                type="button"
                aria-label="Close booking form"
                onClick={() => setBookingShop(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {loadingServices ? (
              <p className="py-8 text-center text-sm text-slate-500">Loading services...</p>
            ) : services.length === 0 ? (
              <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">This shop has no services available for booking yet.</p>
            ) : (
              <form className="space-y-4" onSubmit={submitBooking}>
                <label className="block text-sm font-medium text-slate-700">
                  Laundry service
                  <select
                    required
                    value={serviceId}
                    onChange={(event) => setServiceId(event.target.value)}
                    className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3"
                  >
                    {services.map((service) => (
                      <option key={service._id} value={service._id}>{service.name} · ₱{service.price}/{service.unit.toLowerCase()}</option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Estimated weight (kg)
                    <input
                      required
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={weightKg}
                      onChange={(event) => setWeightKg(event.target.value)}
                      className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3"
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Pickup date and time
                    <input
                      required
                      type="datetime-local"
                      min={new Date().toISOString().slice(0, 16)}
                      value={reservedDateTime}
                      onChange={(event) => setReservedDateTime(event.target.value)}
                      className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3"
                    />
                  </label>
                </div>
                <label className="block text-sm font-medium text-slate-700">
                  Pickup and delivery address
                  <textarea
                    required
                    rows={2}
                    value={bookingAddress}
                    onChange={(event) => setBookingAddress(event.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 p-3"
                    placeholder="Enter the address for pickup and return"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Notes for the shop <span className="font-normal text-slate-400">(optional)</span>
                  <textarea
                    rows={2}
                    value={bookingNotes}
                    onChange={(event) => setBookingNotes(event.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 p-3"
                    placeholder="Anything the laundry team should know?"
                  />
                </label>
                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm text-slate-600">Payment on delivery · Cash</span>
                  <button
                    type="submit"
                    disabled={submittingBooking || loadingServices}
                    className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {submittingBooking ? "Sending..." : "Send booking"}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
