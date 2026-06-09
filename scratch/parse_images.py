import json

with open(r"h:\640_cheers_Soft\scratch\591_api_response.json", "r", encoding="utf-8") as f:
    data = json.load(f)

d = data.get("data", {})

# Let's inspect where image lists are.
# Common image lists are in data['remark'] or data['houseDetail'] or data['media']? Let's check keys of d that might contain image lists.
for k, v in d.items():
    if isinstance(v, list) and len(v) > 0:
        # Check if first element contains string or is a dict with image keys
        print(f"List key: {k}, length: {len(v)}, first item type: {type(v[0])}")
        if isinstance(v[0], str) and ("jpg" in v[0] or "png" in v[0] or "http" in v[0]):
            print(f"  First item: {v[0]}")
        elif isinstance(v[0], dict):
            # check if any val contains jpg/png
            for sk, sv in v[0].items():
                if isinstance(sv, str) and ("jpg" in sv or "png" in sv or "http" in sv):
                    print(f"  First item dict: {sk} -> {sv}")
    elif isinstance(v, dict):
        # check sub-keys
        for sk, sv in v.items():
            if isinstance(sv, list) and len(sv) > 0:
                print(f"Dict key: {k} -> {sk}, length: {len(sv)}, type: {type(sv[0])}")
                if isinstance(sv[0], str) and ("jpg" in sv[0] or "png" in sv[0]):
                    print(f"    First: {sv[0]}")
                elif isinstance(sv[0], dict):
                    for ssk, ssv in sv[0].items():
                        if isinstance(ssv, str) and ("jpg" in ssv or "png" in ssv):
                            print(f"    First dict: {ssk} -> {ssv}")
