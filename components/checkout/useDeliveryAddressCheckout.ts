"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  composeDeliveryAddress,
  decomposeDeliveryAddress,
  deliveryAddressToOrderSnapshot,
  deleteDeliveryAddresses,
  fetchAllDeliveryAddressesMerged,
  patchDeliveryAddress,
  postDeliveryAddress,
  type DeliveryAddress,
} from "@/api/premium/premiumDeliveryAddressApi";

const LABEL_OPTIONS = [
  { id: "Home", label: "Zuhause" },
  { id: "Office", label: "Büro" },
  { id: "Other", label: "Sonstiges" },
] as const;

export type DeliveryAddressFormState = {
  phone: string;
  street: string;
  line2: string;
  postal: string;
  city: string;
  description: string;
};

export type DeliveryAddressOrderSnapshot = {
  id: string;
  phone: string;
  address: string;
  description: string;
};

const emptyForm = (): DeliveryAddressFormState => ({
  phone: "",
  street: "",
  line2: "",
  postal: "",
  city: "",
  description: "Home",
});

function formFromAddress(row: DeliveryAddress): DeliveryAddressFormState {
  const parts = decomposeDeliveryAddress(row.address);
  return {
    phone: row.phone,
    street: parts.street,
    line2: parts.line2,
    postal: parts.postal,
    city: parts.city,
    description: row.description || "Home",
  };
}

function validateForm(f: DeliveryAddressFormState): string | null {
  if (!f.phone.trim()) return "Bitte Telefonnummer angeben.";
  const hasStreet = Boolean(f.street.trim());
  const hasPlzOrt = Boolean(f.postal.trim() && f.city.trim());
  if (!hasStreet && !hasPlzOrt) {
    return "Bitte Straße und Hausnummer oder PLZ und Ort angeben.";
  }
  return null;
}

function isFormValid(f: DeliveryAddressFormState): boolean {
  return validateForm(f) === null;
}

export { LABEL_OPTIONS, validateForm };

export function useDeliveryAddressCheckout(customerId: string | null) {
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingForm, setSavingForm] = useState(false);
  const [savingContinue, setSavingContinue] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [form, setForm] = useState<DeliveryAddressFormState>(() => emptyForm());
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!customerId) {
      setAddresses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const rows = await fetchAllDeliveryAddressesMerged(customerId, 20);
      setAddresses(rows);
      const selected = rows.find(r => r.isSelected) ?? rows[0] ?? null;
      setSelectedId(prev => {
        if (prev && rows.some(r => r.id === prev)) return prev;
        return selected?.id ?? null;
      });
    } catch (e) {
      setLoadError(
        e instanceof Error ? e.message : "Adressen konnten nicht geladen werden.",
      );
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const formActive = showNewForm || Boolean(editingId);

  const patchForm = useCallback((patch: Partial<DeliveryAddressFormState>) => {
    setForm(prev => ({ ...prev, ...patch }));
  }, []);

  const selectAddress = useCallback((row: DeliveryAddress) => {
    setSelectedId(row.id);
    setShowNewForm(false);
    setEditingId(null);
    setForm(formFromAddress(row));
  }, []);

  const startNewAddress = useCallback(() => {
    setShowNewForm(true);
    setEditingId(null);
    setSelectedId(null);
    setForm(emptyForm());
  }, []);

  const setStandardAddressNow = useCallback(
    async (id: string) => {
      if (!customerId) return;
      setSettingPrimaryId(id);
      try {
        await patchDeliveryAddress(id, { isSelected: true });
        await reload();
        setSelectedId(id);
        toast.success("Standard-Lieferadresse aktualisiert", {
          id: "checkout-primary-set",
          duration: 2400,
        });
      } catch (e) {
        const msg =
          e instanceof Error
            ? e.message
            : "Standard-Adresse konnte nicht gesetzt werden.";
        toast.error(msg, { id: "checkout-primary-err", duration: 4000 });
      } finally {
        setSettingPrimaryId(null);
      }
    },
    [customerId, reload],
  );

  const startEditAddress = useCallback((row: DeliveryAddress) => {
    setEditingId(row.id);
    setSelectedId(row.id);
    setShowNewForm(false);
    setForm(formFromAddress(row));
  }, []);

  const composedAddress = useMemo(
    () =>
      composeDeliveryAddress({
        street: form.street,
        line2: form.line2,
        postal: form.postal,
        city: form.city,
        country: "Deutschland",
      }),
    [form.street, form.line2, form.postal, form.city],
  );

  const canSaveForm = useMemo(() => {
    if (!formActive) return false;
    if (!customerId) return false;
    return isFormValid(form);
  }, [customerId, formActive, form]);

  const canContinue = useMemo(() => {
    if (!customerId || formActive) return false;
    return Boolean(selectedId && addresses.some(a => a.id === selectedId));
  }, [customerId, formActive, selectedId, addresses]);

  const cancelForm = useCallback(() => {
    setShowNewForm(false);
    setEditingId(null);
    const primary = addresses.find(a => a.isSelected) ?? addresses[0];
    if (primary) {
      setSelectedId(primary.id);
      setForm(formFromAddress(primary));
    }
  }, [addresses]);

  const handleSaveAddress = async () => {
    if (!customerId) {
      toast.error("Kein Kundenprofil — bitte den Kiosk-Flow starten.", {
        duration: 4500,
      });
      return;
    }
    const err = validateForm(form);
    if (err) {
      toast.error(err, { id: "checkout-addr-val" });
      return;
    }

    setSavingForm(true);
    try {
      const fields = {
        phone: form.phone.trim(),
        address: composedAddress,
        description: form.description.trim() || "Home",
      };
      const saved = editingId
        ? await patchDeliveryAddress(editingId, {
            ...fields,
            isSelected:
              addresses.find(a => a.id === editingId)?.isSelected ?? false,
          })
        : await postDeliveryAddress({
            customer_id: customerId,
            ...fields,
            isSelected: addresses.length === 0,
          });

      await reload();
      setShowNewForm(false);
      setEditingId(null);
      setSelectedId(saved.id);
      toast.success(
        editingId ? "Adresse aktualisiert" : "Adresse gespeichert",
        { id: "checkout-addr-saved", duration: 2400 },
      );
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Adresse konnte nicht gespeichert werden.";
      toast.error(msg, { id: "checkout-addr-err", duration: 4500 });
    } finally {
      setSavingForm(false);
    }
  };

  const handleContinue = async (
    onComplete: (address: DeliveryAddressOrderSnapshot) => void,
  ) => {
    if (!customerId) {
      toast.error("Kein Kundenprofil — bitte den Kiosk-Flow starten.", {
        duration: 4500,
      });
      return;
    }
    if (formActive) {
      toast.error("Bitte die Adresse zuerst speichern.", {
        id: "checkout-save-first",
        duration: 4000,
      });
      return;
    }
    if (!selectedId) {
      toast.error("Bitte eine Lieferadresse auswählen.");
      return;
    }

    const existing = addresses.find(a => a.id === selectedId);
    if (!existing) {
      toast.error("Bitte eine Lieferadresse auswählen.");
      return;
    }

    setSavingContinue(true);
    try {
      onComplete(deliveryAddressToOrderSnapshot(existing));
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Weiterleitung nicht möglich.";
      toast.error(msg, { id: "checkout-continue-err", duration: 4500 });
    } finally {
      setSavingContinue(false);
    }
  };

  const confirmDeleteAddress = async () => {
    if (!deleteTargetId || !customerId) return;
    setDeleting(true);
    try {
      await deleteDeliveryAddresses([deleteTargetId]);
      await reload();
      if (selectedId === deleteTargetId) {
        setSelectedId(null);
      }
      setDeleteTargetId(null);
      toast.success("Adresse entfernt", { id: "checkout-addr-del", duration: 2200 });
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Adresse konnte nicht gelöscht werden.";
      toast.error(msg, { id: "checkout-addr-del-err", duration: 4000 });
    } finally {
      setDeleting(false);
    }
  };

  return {
    addresses,
    loading,
    savingForm,
    savingContinue,
    deleteTargetId,
    setDeleteTargetId,
    deleting,
    loadError,
    selectedId,
    editingId,
    showNewForm,
    form,
    settingPrimaryId,
    formActive,
    composedAddress,
    canSaveForm,
    canContinue,
    patchForm,
    selectAddress,
    startNewAddress,
    setStandardAddressNow,
    startEditAddress,
    cancelForm,
    handleSaveAddress,
    handleContinue,
    confirmDeleteAddress,
  };
}
