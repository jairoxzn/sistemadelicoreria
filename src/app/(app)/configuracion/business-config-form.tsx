"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ImageUploadField } from "@/components/shared/image-upload-field";
import {
  businessConfigSchema,
  type BusinessConfigValues,
  type BusinessConfigFormInput,
} from "@/validations/business-config";
import { updateBusinessConfig, uploadBusinessLogo, uploadBusinessBanner } from "./actions";

type ConfigData = {
  tradeName: string;
  businessName: string | null;
  ruc: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  igvPercent: number;
  ticketFooter: string | null;
} | null;

export function BusinessConfigForm({ config }: { config: ConfigData }) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const form = useForm<BusinessConfigFormInput, unknown, BusinessConfigValues>({
    resolver: zodResolver(businessConfigSchema),
    defaultValues: {
      tradeName: config?.tradeName ?? "LiquorFlow",
      businessName: config?.businessName ?? "",
      ruc: config?.ruc ?? "",
      address: config?.address ?? "",
      phone: config?.phone ?? "",
      whatsapp: config?.whatsapp ?? "",
      logoUrl: config?.logoUrl ?? "",
      bannerUrl: config?.bannerUrl ?? "",
      igvPercent: config?.igvPercent ?? 18,
      ticketFooter: config?.ticketFooter ?? "",
    },
  });

  async function onSubmit(values: BusinessConfigValues) {
    setIsSubmitting(true);
    const result = await updateBusinessConfig(values);
    setIsSubmitting(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Configuración guardada.");
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-base">Datos del negocio</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="tradeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre comercial</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razón social</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ruc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RUC</FormLabel>
                    <FormControl>
                      <Input maxLength={11} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="igvPercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IGV (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        value={(field.value as number | string | undefined) ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Logo del negocio (opcional)</FormLabel>
                    <FormControl>
                      <ImageUploadField
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        uploadAction={uploadBusinessLogo}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bannerUrl"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Banner del catálogo (opcional)</FormLabel>
                    <FormControl>
                      <ImageUploadField
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        uploadAction={uploadBusinessBanner}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Se muestra como imagen de fondo del banner principal en tu catálogo público.
                      Recomendado: imagen horizontal, mínimo 1200x500px.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ticketFooter"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Mensaje final del ticket</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="size-4" />
              Guardar cambios
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
