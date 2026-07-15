import { useEffect, useState } from "react";
import { Car as CarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Make {
  id: string;
  name: string;
  name_ar: string | null;
}

interface Model {
  id: string;
  name: string;
  make_id: string;
}

const OTHER = "__other__";

const fieldCls =
  "h-12 w-full rounded-xl bg-white border border-border text-foreground placeholder:text-muted-foreground/80 focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/15 transition px-4 text-sm shadow-sm disabled:bg-muted/40 disabled:text-muted-foreground disabled:cursor-not-allowed";

const selectCls =
  fieldCls + " cursor-pointer appearance-auto";

export interface CarMakeModelValue {
  make: string;
  model: string;
}

export function CarMakeModelSelect({
  value,
  onChange,
}: {
  value: CarMakeModelValue;
  onChange: (v: CarMakeModelValue) => void;
}) {
  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [makeId, setMakeId] = useState<string>("");
  const [otherMake, setOtherMake] = useState(false);
  const [otherModel, setOtherModel] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("car_makes")
        .select("id,name,name_ar")
        .eq("is_active", true)
        .order("sort_order")
        .order("name");

      setMakes((data as Make[]) ?? []);
    })();
  }, []);

  useEffect(() => {
    if (!makeId) {
      setModels([]);
      return;
    }

    (async () => {
      const { data } = await supabase
        .from("car_models")
        .select("id,name,make_id")
        .eq("make_id", makeId)
        .eq("is_active", true)
        .order("name");

      setModels((data as Model[]) ?? []);
    })();
  }, [makeId]);

  const label = (m: { name: string; name_ar?: string | null }) =>
    m.name_ar || m.name;

  return (
    <div className="space-y-2">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-bold text-foreground mb-2 inline-flex items-center gap-1.5">
            <CarIcon className="h-4 w-4 text-primary" />
            الماركة *
          </label>

          {!otherMake ? (
            <select
              className={selectCls}
              value={makeId}
              onChange={(e) => {
                const v = e.target.value;

                if (v === OTHER) {
                  setOtherMake(true);
                  setOtherModel(false);
                  setMakeId("");
                  setModels([]);
                  onChange({ make: "", model: "" });
                  return;
                }

                setMakeId(v);
                setOtherModel(false);

                const m = makes.find((x) => x.id === v);
                onChange({ make: m ? label(m) : "", model: "" });
              }}
            >
              <option value="">اختر ماركة السيارة</option>
              {makes.map((m) => (
                <option key={m.id} value={m.id}>
                  {label(m)}
                </option>
              ))}
              <option value={OTHER}>أخرى...</option>
            </select>
          ) : (
            <div className="flex gap-2">
              <input
                className={fieldCls}
                placeholder="اكتب اسم الماركة"
                value={value.make}
                onChange={(e) =>
                  onChange({ ...value, make: e.target.value })
                }
              />

              <button
                type="button"
                onClick={() => {
                  setOtherMake(false);
                  setOtherModel(false);
                  setMakeId("");
                  setModels([]);
                  onChange({ make: "", model: "" });
                }}
                className="h-12 px-4 rounded-xl border border-border bg-white text-sm font-bold hover:border-primary transition"
              >
                قائمة
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-bold text-foreground mb-2 inline-flex items-center gap-1.5">
            <CarIcon className="h-4 w-4 text-primary" />
            الموديل
          </label>

          {otherMake ? (
            <input
              className={fieldCls}
              placeholder="اكتب اسم الموديل"
              value={value.model}
              onChange={(e) =>
                onChange({ ...value, model: e.target.value })
              }
            />
          ) : !makeId ? (
            <select className={selectCls} value="" disabled>
              <option value="">اختر الماركة أولًا</option>
            </select>
          ) : !otherModel ? (
            <select
              className={selectCls}
              value={value.model}
              onChange={(e) => {
                const v = e.target.value;

                if (v === OTHER) {
                  setOtherModel(true);
                  onChange({ ...value, model: "" });
                  return;
                }

                onChange({ ...value, model: v });
              }}
            >
              <option value="">اختر موديل السيارة</option>

              {models.length > 0 ? (
                models.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  لا توجد موديلات لهذه الماركة
                </option>
              )}

              <option value={OTHER}>أخرى...</option>
            </select>
          ) : (
            <div className="flex gap-2">
              <input
                className={fieldCls}
                placeholder="اكتب اسم الموديل"
                value={value.model}
                onChange={(e) =>
                  onChange({ ...value, model: e.target.value })
                }
              />

              <button
                type="button"
                onClick={() => {
                  setOtherModel(false);
                  onChange({ ...value, model: "" });
                }}
                className="h-12 px-4 rounded-xl border border-border bg-white text-sm font-bold hover:border-primary transition"
              >
                قائمة
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        اختر الماركة والموديل من القائمة، أو اختر "أخرى" إذا لم تجد سيارتك.
      </p>
    </div>
  );
}