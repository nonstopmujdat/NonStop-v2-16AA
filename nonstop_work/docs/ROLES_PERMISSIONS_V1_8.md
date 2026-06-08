# NONSTOP Rol ve Yetki Matrisi V1.8

| Yetki | SUPER_ADMIN | NONSTOP_OPERATOR | CITY_ADMIN | CLUB_ADMIN | VIEWER |
|---|---:|---:|---:|---:|---:|
| MANAGE_USERS | ✅ | ❌ | ❌ | ❌ | ❌ |
| MANAGE_CITIES | ✅ | ❌ | ❌ | ❌ | ❌ |
| MANAGE_ORGANIZATIONS | ✅ | ✅ | ✅ | ❌ | ❌ |
| MANAGE_CLUBS | ✅ | ✅ | ✅ | Kendi kulübü | ❌ |
| MANAGE_TEAMS | ✅ | ✅ | ✅ | Kendi kulübü | ❌ |
| CREATE_PLAYER | ✅ | ✅ | ✅ | Talep açar | ❌ |
| EDIT_PLAYER | ✅ | ✅ | ✅ | Sınırlı | ❌ |
| APPROVE_PLAYER | ✅ | ✅ | ✅ | ❌ | ❌ |
| APPROVE_TRANSFER | ✅ | ✅ | ✅ | ❌ | ❌ |
| MANAGE_KVKK | ✅ | ✅ | ✅ | Kendi kulübü | ❌ |
| MANAGE_MATCHES | ✅ | ✅ | ✅ | ❌ | ❌ |
| LIVE_STATS | ✅ | ✅ | ✅ | ❌ | ❌ |
| SHOT_CHART | ✅ | ✅ | ✅ | Görür | Görür |
| FOUL_CHART | ✅ | ✅ | ✅ | Görür | Görür |
| VIEW_REPORTS | ✅ | ✅ | ✅ | Kendi kulübü | Sınırlı |
| GENERATE_REPORTS | ✅ | ✅ | ✅ | Kendi kulübü | ❌ |

## Operatör kuralı

- HOME_OPERATOR sadece ev sahibi oyuncularını görür.
- AWAY_OPERATOR sadece misafir oyuncularını görür.
- `can_control_clock=true` olan sahadaki operatör zamanı yönetir.
