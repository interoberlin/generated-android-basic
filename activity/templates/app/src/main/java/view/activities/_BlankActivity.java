package <%= activityPackage %>;

import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;

public class <%= activityName %> extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.<%= layoutName %>);
    }

}
