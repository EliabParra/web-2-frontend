/**
 * Transaction numbers for POST /toProccess.
 * They must match the backend's pinned map in scripts/db/tx-map.json; a new BO method gets
 * the next free number in both files, and existing numbers never change.
 */
export const TX = {
  auth: { register: 1000, verifyEmail: 1001, requestEmailVerification: 1002, requestPasswordReset: 1003, verifyPasswordReset: 1004, resetPassword: 1005, requestUsername: 1006, getNavigation: 1007, switchActiveProfile: 1008 },
  category: { get: 1009, getAll: 1010, create: 1011, update: 1012, delete: 1013 },
  component: { get: 1014, getAll: 1015, create: 1016, update: 1017, delete: 1018 },
  devolution: { get: 1019, getAll: 1020, create: 1021, update: 1022, delete: 1023, registerDevolution: 1024, getAllDevolutions: 1025, getUserDevolution: 1026, getDevolution: 1027 },
  equipment: { get: 1028, getAll: 1029, create: 1030, update: 1031, delete: 1032 },
  inventory: { get: 1033, getAll: 1034, create: 1035, update: 1036, delete: 1037, addStock: 1038, removeStock: 1039, moveLocation: 1040 },
  lapse: { get: 1041, getAll: 1042, create: 1043, update: 1044, delete: 1045 },
  loan: { getRequest: 1046, getAllRequests: 1047, requestLoan: 1048, acceptRequestLoan: 1049, rejectRequestLoan: 1050, getLoan: 1051, getAllLoans: 1052, registerLoan: 1053 },
  location: { getAll: 1054, create: 1055, update: 1056, delete: 1057, get: 1058 },
  menu: { get: 1059, getAll: 1060, create: 1061, update: 1062, delete: 1063 },
  method: { get: 1064, getAll: 1065, create: 1066, update: 1067, delete: 1068 },
  notification: { get: 1069, getAll: 1070, create: 1071, update: 1072, delete: 1073 },
  object: { get: 1074, getAll: 1075, create: 1076, update: 1077, delete: 1078 },
  option: { get: 1079, getAll: 1080, create: 1081, update: 1082, delete: 1083 },
  profile: { get: 1084, getAll: 1085, create: 1086, update: 1087, delete: 1088, grantPermission: 1089, revokePermission: 1090, assignSubsystem: 1091, revokeSubsystem: 1092, assignMenu: 1093, revokeMenu: 1094, assignOption: 1095, revokeOption: 1096 },
  property: { get: 1097, getAll: 1098, create: 1099, update: 1100, delete: 1101 },
  report: { get: 1102, getAll: 1103, create: 1104, update: 1105, delete: 1106 },
  subsystem: { get: 1107, getAll: 1108, create: 1109, update: 1110, delete: 1111 },
  user: { get: 1112, getAll: 1113, create: 1114, update: 1115, delete: 1116, assignProfile: 1117, revokeProfile: 1118 },
} as const;
