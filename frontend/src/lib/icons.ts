import {
  Server,
  Monitor,
  Box,
  Router,
  Network,
  Shield,
  Printer,
  Radio,
  HardDrive,
  type LucideIcon,
} from "lucide-react";
import type { DeviceType } from "../types";

export const DEVICE_ICONS: Record<DeviceType, LucideIcon> = {
  server: Server,
  workstation: Monitor,
  vm: Box,
  router: Router,
  switch: Network,
  firewall: Shield,
  network: Radio,
  printer: Printer,
  other: HardDrive,
};
