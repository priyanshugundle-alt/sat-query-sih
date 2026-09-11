import os
import ast
import sys
import importlib.util

def get_imports(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        try:
            tree = ast.parse(f.read())
        except Exception:
            return set()
            
    imports = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                imports.add(alias.name.split('.')[0])
        elif isinstance(node, ast.ImportFrom):
            if node.module and node.level == 0:
                imports.add(node.module.split('.')[0])
    return imports

def is_standard_library(module_name):
    if module_name in sys.builtin_module_names:
        return True
    try:
        spec = importlib.util.find_spec(module_name)
        if spec is None:
            return False
        # stdlib modules usually don't have an origin or are located in the python installation base
        if spec.origin is None:
            return True
        if 'site-packages' in spec.origin or 'dist-packages' in spec.origin:
            return False
        return True
    except Exception:
        return False

missing_packages = {}

# Walk through the current directory
for root, dirs, files in os.walk('.'):
    # Prevent os.walk from descending into these directories
    dirs[:] = [d for d in dirs if d not in ['.venv', '__pycache__', '.git', 'venv']]
    for file in files:
        if file.endswith('.py'):
            filepath = os.path.join(root, file)
            imports = get_imports(filepath)
            
            for imp in imports:
                # Try to import it
                try:
                    __import__(imp)
                except ImportError:
                    # Ignore local modules
                    local_module_path_py = os.path.join(root, imp + '.py')
                    local_module_path_dir = os.path.join(root, imp, '__init__.py')
                    if os.path.exists(local_module_path_py) or os.path.exists(local_module_path_dir):
                        continue
                        
                    if imp not in missing_packages:
                        missing_packages[imp] = []
                    missing_packages[imp].append(filepath)

if not missing_packages:
    print("All imported external packages appear to be installed in your environment!")
else:
    print("Missing external packages (and the files that import them):")
    for pkg, files in missing_packages.items():
        print(f"\n- {pkg}:")
        # Deduplicate files and show only relative paths
        for f in set(files):
            print(f"  -> {os.path.relpath(f, '.')}")
