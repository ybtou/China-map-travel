export const provinceProgress: Record<string, { visited: number; total: number }> = {
  '北京市': { visited: 16, total: 16 },
  '天津市': { visited: 16, total: 16 },
  '河北省': { visited: 8, total: 11 },
  '山西省': { visited: 3, total: 11 },
  '内蒙古自治区': { visited: 2, total: 12 },
  '辽宁省': { visited: 7, total: 14 },
  '吉林省': { visited: 4, total: 9 },
  '黑龙江省': { visited: 5, total: 13 },
  '上海市': { visited: 16, total: 16 },
  '江苏省': { visited: 10, total: 13 },
  '浙江省': { visited: 9, total: 11 },
  '安徽省': { visited: 6, total: 16 },
  '福建省': { visited: 5, total: 9 },
  '江西省': { visited: 4, total: 11 },
  '山东省': { visited: 12, total: 16 },
  '河南省': { visited: 10, total: 18 },
  '湖北省': { visited: 8, total: 17 },
  '湖南省': { visited: 7, total: 14 },
  '广东省': { visited: 15, total: 21 },
  '广西壮族自治区': { visited: 3, total: 14 },
  '海南省': { visited: 10, total: 19 },
  '重庆市': { visited: 20, total: 38 },
  '四川省': { visited: 10, total: 21 },
  '贵州省': { visited: 2, total: 9 },
  '云南省': { visited: 8, total: 16 },
  '西藏自治区': { visited: 0, total: 7 },
  '陕西省': { visited: 5, total: 10 },
  '甘肃省': { visited: 3, total: 14 },
  '青海省': { visited: 1, total: 8 },
  '宁夏回族自治区': { visited: 2, total: 5 },
  '新疆维吾尔自治区': { visited: 1, total: 24 },
  '台湾省': { visited: 0, total: 0 },
  '香港特别行政区': { visited: 18, total: 18 },
  '澳门特别行政区': { visited: 8, total: 8 },
};

export function getProgressForName(name: string): { visited: number; total: number } {
  return provinceProgress[name] || { visited: 0, total: 0 };
}

export function isProvinceVisited(name: string): boolean {
  const p = provinceProgress[name];
  return p ? p.visited > 0 : false;
}

export const totalVisitedProvinces = Object.values(provinceProgress).filter(p => p.visited > 0).length;
export const totalProvinces = Object.keys(provinceProgress).length;
